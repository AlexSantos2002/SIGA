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
import { PermissionService } from '../permission/permission.service';
import { AdopterRow, buildAdopterPayload, mapAdopterRow } from './adopter.mapper';

@Injectable({
  providedIn: 'root',
})
export class AdoptersService {
  constructor(
    private authService: AuthService,
    private permissionService: PermissionService,
  ) {}

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

    return ((data ?? []) as AdopterRow[]).map(mapAdopterRow);
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

    return mapAdopterRow(data as AdopterRow);
  }

  async register(request: RegisterAdopterRequest): Promise<Adopter> {
    this.permissionService.assert('adopters.create');

    const organizationId = this.getCurrentOrganizationId();
    const payload = buildAdopterPayload(request);

    await this.ensureEmailAvailableInOrganization(payload.email, organizationId);

    const { data, error } = await withTimeout<any>(
      supabase
        .from('adopters')
        .insert({
          ...payload,
          organization_id: organizationId,
        })
        .select()
        .single(),
    );

    if (error?.code === SUPABASE_ERROR_CODES.UNIQUE_VIOLATION) {
      if (this.isGlobalEmailConstraintError(error)) {
        throw new DBError(ERROR_CODES.ADOPTERS_EMAIL_SCOPE_OUTDATED);
      }

      throw new BusinessError(ERROR_CODES.EMAIL_ALREADY_EXISTS);
    }

    if (error && this.isMissingAdopterColumnError(error)) {
      throw new DBError(ERROR_CODES.ADOPTERS_SCHEMA_OUTDATED);
    }

    if (error || !data) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }

    return mapAdopterRow(data as AdopterRow);
  }

  async update(adopterId: string, request: UpdateAdopterRequest): Promise<Adopter> {
    this.permissionService.assert('adopters.update');

    const organizationId = this.getCurrentOrganizationId();
    const payload = buildAdopterPayload(request);

    await this.ensureEmailAvailableInOrganization(payload.email, organizationId, adopterId);

    const { data, error } = await withTimeout<any>(
      supabase
        .from('adopters')
        .update(payload)
        .eq('id', adopterId)
        .eq('organization_id', organizationId)
        .select()
        .single(),
    );

    if (error?.code === SUPABASE_ERROR_CODES.UNIQUE_VIOLATION) {
      if (this.isGlobalEmailConstraintError(error)) {
        throw new DBError(ERROR_CODES.ADOPTERS_EMAIL_SCOPE_OUTDATED);
      }

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

    return mapAdopterRow(data as AdopterRow);
  }

  async delete(adopterId: string): Promise<void> {
    this.permissionService.assert('adopters.delete');

    const organizationId = this.getCurrentOrganizationId();

    await this.getById(adopterId);

    const { error } = await withTimeout<any>(
      supabase.from('adopters').delete().eq('id', adopterId).eq('organization_id', organizationId),
    );

    if (error) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }
  }

  private getCurrentOrganizationId(): string {
    const organizationId = this.authService.getCurrentOrganizationId();

    if (!organizationId) {
      throw new AuthenticationError(ERROR_CODES.NOT_AUTHENTICATED);
    }

    return organizationId;
  }

  private async ensureEmailAvailableInOrganization(
    email: string,
    organizationId: string,
    ignoredAdopterId?: string,
  ): Promise<void> {
    let query = supabase
      .from('adopters')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('email', email)
      .limit(1);

    if (ignoredAdopterId) {
      query = query.neq('id', ignoredAdopterId);
    }

    const { data, error } = await withTimeout<any>(query);

    if (error) {
      throw new DBError(ERROR_CODES.UNABLE_TO_GET_ADOPTER);
    }

    if ((data ?? []).length > 0) {
      throw new BusinessError(ERROR_CODES.EMAIL_ALREADY_EXISTS);
    }
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

  private isGlobalEmailConstraintError(error: any): boolean {
    const message = `${error?.message ?? ''} ${error?.details ?? ''}`;

    return message.includes('adopters_email_key');
  }
}
