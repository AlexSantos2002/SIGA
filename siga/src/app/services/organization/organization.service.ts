import { Injectable} from '@angular/core';
import {supabase} from '../../../../supabase/supabase';
import {RegisterOrganizationRequest} from '../../models/auth/register-organization-request';
import { BusinessError, DBError } from '../../error/app-error';
import { SUPABASE_ERROR_CODES } from '../../error/supabase-error-codes';
import { ERROR_CODES } from '../../error/error-codes';
import { AuthApiError } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root',
})
export class OrganizationService {

  /**
   * @description
   * Cria uma organizacao com nome, email, numero e morada
   * Cria tambem o administrador principal da organizacao
   */
  async registerOrganization(request: RegisterOrganizationRequest) {
    // Verifica se o email da organização já existe
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('email', request.email)
      .maybeSingle();

    if (existingOrg) {
      throw new BusinessError(ERROR_CODES.ORGANIZATION_ALREADY_EXISTS);
    }

    // Cria o administrador
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: request.adminEmail,
      password: request.adminPassword,
    });

    if (authError instanceof AuthApiError) {
      throw new BusinessError(ERROR_CODES.EMAIL_ALREADY_EXISTS);
    }

    if (authError || !authData.user) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }

    // Cria a organização
    const { data: organization, error: organizationError } = await supabase
      .from('organizations')
      .insert([{
        name: request.name,
        phone: request.phone,
        email: request.email,
        address: request.address,
      }])
      .select()
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

    const { error: userError } = await supabase.from('users').insert([{
      id: authData.user.id,
      name: request.adminName,
      email: request.adminEmail,
      organization_id: organization.id,
      role: 'admin',
    }]);

    if (userError) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }

    return organization;
  }
}
