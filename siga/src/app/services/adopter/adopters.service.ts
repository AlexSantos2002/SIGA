import { Injectable } from '@angular/core';

import { supabase } from '../../../../supabase/supabase';
import { AuthenticationError, BusinessError, DBError, NotFoundError } from '../../error/app-error';
import { ERROR_CODES } from '../../error/error-codes';
import { SUPABASE_ERROR_CODES } from '../../error/supabase-error-codes';
import { Adopter } from '../../models/adopter/adopter.model';
import { RegisterAdopterRequest } from '../../models/adopter/register-adopter-request';
import { UpdateAdopterRequest } from '../../models/adopter/update-adopter-request';
import { withTimeout } from '../../utils/utils';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AdoptersService {
  constructor(private authService: AuthService) {}

  private mapToAdopter(adopter: any): Adopter {
    return {
      id: adopter.id,
      name: adopter.name,
      lastName: adopter.last_name,
      email: adopter.email,
      phone: adopter.phone,
      documentType: adopter.document_type,
      documentNumber: adopter.document_number,
      birthDate: adopter.birth_date,
      address: adopter.address,
      city: adopter.city,
      postalCode: adopter.postal_code,
      housingType: adopter.housing_type,
      hasOutdoorSpace: adopter.has_outdoor_space ?? false,
      hasOtherAnimals: adopter.has_other_animals ?? false,
      otherAnimalsDescription: adopter.other_animals_description,
      householdMembers: adopter.household_members,
      employmentStatus: adopter.employment_status,
      experienceWithAnimals: adopter.experience_with_animals,
      preferredSpecies: adopter.preferred_species,
      adoptionMotivation: adopter.adoption_motivation,
      notes: adopter.notes,
      isFlagged: adopter.is_flagged ?? false,
      flagReason: adopter.flag_reason,
      flaggedAt: adopter.flagged_at,
      createdAt: adopter.created_at,
    };
  }

  private toNullableString(value?: string | null): string | null {
    const trimmedValue = value?.trim();

    return trimmedValue ? trimmedValue : null;
  }

  private getPayloadFromRequest(
    request: RegisterAdopterRequest | UpdateAdopterRequest,
  ): Record<string, any> {
    const isFlagged = request.isFlagged ?? false;

    return {
      name: request.name.trim(),
      last_name: request.lastName.trim(),
      email: request.email.trim(),
      phone: this.toNullableString(request.phone),
      document_type: this.toNullableString(request.documentType),
      document_number: this.toNullableString(request.documentNumber),
      birth_date: this.toNullableString(request.birthDate),
      address: this.toNullableString(request.address),
      city: this.toNullableString(request.city),
      postal_code: this.toNullableString(request.postalCode),
      housing_type: this.toNullableString(request.housingType),
      has_outdoor_space: request.hasOutdoorSpace ?? false,
      has_other_animals: request.hasOtherAnimals ?? false,
      other_animals_description: this.toNullableString(request.otherAnimalsDescription),
      household_members: this.toNullableString(request.householdMembers),
      employment_status: this.toNullableString(request.employmentStatus),
      experience_with_animals: this.toNullableString(request.experienceWithAnimals),
      preferred_species: this.toNullableString(request.preferredSpecies),
      adoption_motivation: this.toNullableString(request.adoptionMotivation),
      notes: this.toNullableString(request.notes),
      is_flagged: isFlagged,
      flag_reason: isFlagged ? this.toNullableString(request.flagReason) : null,
      flagged_at: isFlagged ? new Date().toISOString() : null,
    };
  }

  private getCurrentOrganizationId(): string {
    const organizationId = this.authService.getCurrentOrganizationId();

    if (!organizationId) {
      throw new AuthenticationError(ERROR_CODES.NOT_AUTHENTICATED);
    }

    return organizationId;
  }

  private isMissingAdopterColumnError(error: any): boolean {
    const message = `${error?.message ?? ''} ${error?.details ?? ''}`;

    return (
      error?.code === 'PGRST204' ||
      error?.code === '42703' ||
      message.includes('schema cache') ||
      message.includes('Could not find') ||
      message.includes('document_type') ||
      message.includes('is_flagged')
    );
  }

  async getAll(): Promise<Adopter[]> {
    const organizationId = this.getCurrentOrganizationId();

    const { data, error } = await withTimeout<any>(
      supabase
        .from('adopters')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false }),
    );

    if (error) {
      throw new DBError(ERROR_CODES.UNABLE_TO_GET_ADOPTERS);
    }

    return (data ?? []).map((adopter: any) => this.mapToAdopter(adopter));
  }

  async getById(adopterId: string): Promise<Adopter> {
    const organizationId = this.getCurrentOrganizationId();

    const { data, error } = await withTimeout<any>(
      supabase
        .from('adopters')
        .select('*')
        .eq('id', adopterId)
        .eq('organization_id', organizationId)
        .single(),
    );

    if (error?.code === SUPABASE_ERROR_CODES.NO_ROWS_RETURNED || !data) {
      throw new NotFoundError(ERROR_CODES.UNABLE_TO_GET_ADOPTER);
    }

    if (error) {
      throw new DBError(ERROR_CODES.UNABLE_TO_GET_ADOPTER);
    }

    return this.mapToAdopter(data);
  }

  async register(request: RegisterAdopterRequest): Promise<Adopter> {
    const organizationId = this.getCurrentOrganizationId();

    const { data, error } = await withTimeout<any>(
      supabase
        .from('adopters')
        .insert({
          ...this.getPayloadFromRequest(request),
          organization_id: organizationId,
        })
        .select()
        .single(),
    );

    if (error?.code === SUPABASE_ERROR_CODES.UNIQUE_VIOLATION) {
      throw new BusinessError(ERROR_CODES.EMAIL_ALREADY_EXISTS);
    }

    if (error && this.isMissingAdopterColumnError(error)) {
      throw new DBError(ERROR_CODES.ADOPTERS_SCHEMA_OUTDATED);
    }

    if (error || !data) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }

    return this.mapToAdopter(data);
  }

  async update(adopterId: string, request: UpdateAdopterRequest): Promise<Adopter> {
    const organizationId = this.getCurrentOrganizationId();

    const { data, error } = await withTimeout<any>(
      supabase
        .from('adopters')
        .update(this.getPayloadFromRequest(request))
        .eq('id', adopterId)
        .eq('organization_id', organizationId)
        .select()
        .single(),
    );

    if (error?.code === SUPABASE_ERROR_CODES.UNIQUE_VIOLATION) {
      throw new BusinessError(ERROR_CODES.EMAIL_ALREADY_EXISTS);
    }

    if (error && this.isMissingAdopterColumnError(error)) {
      throw new DBError(ERROR_CODES.ADOPTERS_SCHEMA_OUTDATED);
    }

    if (error?.code === SUPABASE_ERROR_CODES.NO_ROWS_RETURNED || !data) {
      throw new NotFoundError(ERROR_CODES.UNABLE_TO_GET_ADOPTER);
    }

    if (error) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }

    return this.mapToAdopter(data);
  }

  async delete(adopterId: string): Promise<void> {
    const organizationId = this.getCurrentOrganizationId();

    await this.getById(adopterId);

    const { error } = await withTimeout<any>(
      supabase.from('adopters').delete().eq('id', adopterId).eq('organization_id', organizationId),
    );

    if (error) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }
  }
}
