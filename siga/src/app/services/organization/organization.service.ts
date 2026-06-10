import { Injectable } from '@angular/core';
import { AuthApiError, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../../../../supabase/supabase';
import { BusinessError, DBError } from '../../error/app-error';
import { ERROR_CODES } from '../../error/error-codes';
import { SUPABASE_ERROR_CODES } from '../../error/supabase-error-codes';
import { RegisterOrganizationRequest } from '../../models/auth/register-organization-request';

type OrganizationRegistrationData = Pick<
  RegisterOrganizationRequest,
  'name' | 'email' | 'phone' | 'address' | 'adminName' | 'adminEmail'
> & {
  organizationId?: string;
};

interface OrganizationRow {
  id: string;
  email: string;
}

export interface RegisterOrganizationResult {
  requiresEmailConfirmation: boolean;
  organization: unknown | null;
}

const REGISTRATION_METADATA = {
  type: 'siga_registration_type',
  organizationName: 'siga_organization_name',
  organizationEmail: 'siga_organization_email',
  organizationPhone: 'siga_organization_phone',
  organizationAddress: 'siga_organization_address',
  adminName: 'siga_admin_name',
  organizationId: 'siga_organization_id',
} as const;

@Injectable({
  providedIn: 'root',
})
export class OrganizationService {
  async registerOrganization(request: RegisterOrganizationRequest): Promise<RegisterOrganizationResult> {
    const organizationEmail = this.normalizeEmail(request.email);
    const existingOrg = await this.findOrganizationByEmail(organizationEmail);

    if (existingOrg && (await this.organizationHasUsers(existingOrg.id))) {
      throw new BusinessError(ERROR_CODES.ORGANIZATION_ALREADY_EXISTS);
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: this.normalizeEmail(request.adminEmail),
      password: request.adminPassword,
      options: {
        emailRedirectTo: this.getEmailRedirectUrl(),
        data: this.getRegistrationMetadata(request, existingOrg?.id),
      },
    });

    if (authError instanceof AuthApiError && this.isEmailAlreadyRegisteredError(authError)) {
      throw new BusinessError(ERROR_CODES.EMAIL_ALREADY_EXISTS);
    }

    if (authError || !authData.user) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }

    if (!authData.session) {
      return {
        requiresEmailConfirmation: true,
        organization: null,
      };
    }

    const organization = await this.createOrganizationAndAdminProfile(authData.user.id, {
      ...request,
      organizationId: existingOrg?.id,
    });

    return {
      requiresEmailConfirmation: false,
      organization,
    };
  }

  async completePendingOrganizationRegistration(authUser: SupabaseUser): Promise<void> {
    const { data: existingProfile, error: profileError } = await supabase
      .from('users')
      .select('id')
      .eq('id', authUser.id)
      .maybeSingle();

    if (profileError) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }

    if (existingProfile) {
      return;
    }

    const registrationData = this.getRegistrationDataFromMetadata(authUser);

    if (!registrationData) {
      return;
    }

    await this.createOrganizationAndAdminProfile(authUser.id, registrationData);
  }

  private async createOrganizationAndAdminProfile(
    authUserId: string,
    request: OrganizationRegistrationData,
  ): Promise<unknown> {
    const organization =
      (await this.getReusableOrganization(request)) ?? (await this.createOrganization(request));

    const { error: userError } = await supabase.from('users').insert([
      {
        id: authUserId,
        name: request.adminName.trim(),
        email: this.normalizeEmail(request.adminEmail),
        organization_id: organization.id,
        role: 'admin',
      },
    ]);

    if (userError) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }

    return organization;
  }

  private async createOrganization(request: OrganizationRegistrationData): Promise<OrganizationRow> {
    const { data: organization, error: organizationError } = await supabase
      .from('organizations')
      .insert([
        {
          name: request.name.trim(),
          phone: request.phone.trim(),
          email: this.normalizeEmail(request.email),
          address: request.address.trim(),
        },
      ])
      .select('id,email')
      .single();

    if (
      organizationError?.code === SUPABASE_ERROR_CODES.UNIQUE_VIOLATION ||
      organizationError?.code === SUPABASE_ERROR_CODES.RLS_VIOLATION
    ) {
      throw new BusinessError(ERROR_CODES.ORGANIZATION_ALREADY_EXISTS);
    }

    if (organizationError) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }

    return organization;
  }

  private getRegistrationMetadata(
    request: RegisterOrganizationRequest,
    organizationId?: string,
  ): Record<string, string> {
    const metadata: Record<string, string> = {
      [REGISTRATION_METADATA.type]: 'organization',
      [REGISTRATION_METADATA.organizationName]: request.name.trim(),
      [REGISTRATION_METADATA.organizationEmail]: this.normalizeEmail(request.email),
      [REGISTRATION_METADATA.organizationPhone]: request.phone.trim(),
      [REGISTRATION_METADATA.organizationAddress]: request.address.trim(),
      [REGISTRATION_METADATA.adminName]: request.adminName.trim(),
    };

    if (organizationId) {
      metadata[REGISTRATION_METADATA.organizationId] = organizationId;
    }

    return metadata;
  }

  private getRegistrationDataFromMetadata(authUser: SupabaseUser): OrganizationRegistrationData | null {
    const metadata = authUser.user_metadata ?? {};

    if (metadata[REGISTRATION_METADATA.type] !== 'organization') {
      return null;
    }

    const adminEmail = authUser.email ? this.normalizeEmail(authUser.email) : '';
    const registrationData = {
      name: this.getMetadataString(metadata, REGISTRATION_METADATA.organizationName),
      email: this.getMetadataString(metadata, REGISTRATION_METADATA.organizationEmail),
      phone: this.getMetadataString(metadata, REGISTRATION_METADATA.organizationPhone),
      address: this.getMetadataString(metadata, REGISTRATION_METADATA.organizationAddress),
      adminName: this.getMetadataString(metadata, REGISTRATION_METADATA.adminName),
      adminEmail,
      organizationId: this.getMetadataString(metadata, REGISTRATION_METADATA.organizationId) || undefined,
    };

    if (Object.values(registrationData).some((value) => !value)) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }

    return registrationData;
  }

  private async getReusableOrganization(
    request: OrganizationRegistrationData,
  ): Promise<OrganizationRow | null> {
    const organization = request.organizationId
      ? await this.findOrganizationByIdAndEmail(request.organizationId, this.normalizeEmail(request.email))
      : await this.findOrganizationByEmail(this.normalizeEmail(request.email));

    if (!organization) {
      return null;
    }

    if (await this.organizationHasUsers(organization.id)) {
      throw new BusinessError(ERROR_CODES.ORGANIZATION_ALREADY_EXISTS);
    }

    return organization;
  }

  private async findOrganizationByEmail(email: string): Promise<OrganizationRow | null> {
    const { data, error } = await supabase
      .from('organizations')
      .select('id,email')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }

    return data;
  }

  private async findOrganizationByIdAndEmail(id: string, email: string): Promise<OrganizationRow | null> {
    const { data, error } = await supabase
      .from('organizations')
      .select('id,email')
      .eq('id', id)
      .eq('email', email)
      .maybeSingle();

    if (error) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }

    return data;
  }

  private async organizationHasUsers(organizationId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('organization_id', organizationId)
      .limit(1);

    if (error) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }

    return !!data?.length;
  }

  private getMetadataString(metadata: Record<string, unknown>, key: string): string {
    const value = metadata[key];
    return typeof value === 'string' ? value.trim() : '';
  }

  private getEmailRedirectUrl(): string {
    return `${globalThis.location?.origin ?? ''}/login`;
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private isEmailAlreadyRegisteredError(error: AuthApiError): boolean {
    const message = error.message.toLowerCase();

    return (
      error.code === 'user_already_exists' ||
      message.includes('already registered') ||
      message.includes('already exists')
    );
  }
}
