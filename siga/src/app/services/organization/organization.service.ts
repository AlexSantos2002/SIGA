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

    // Cria a organizacao
    const { data: organization, error: organizationError } = await supabase
      .from('organizations')
      .insert([{
        name: request.name,
        phone: request.phone,
        email: request.email,
        address: request.address
      }])
      .select()
      .single();

    // Emite erro caso o email da organização já esteja registado
    if (organizationError?.code === SUPABASE_ERROR_CODES.UNIQUE_VIOLATION) {
      throw new BusinessError(ERROR_CODES.ORGANIZATION_ALREADY_EXISTS);
    }

    if (organizationError || !organization) throw new DBError();

    const organizationId = organization.id;

    // Cria o administrador no supabase auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: request.adminEmail,
      password: request.adminPassword,
    });

    // Deleta a organizacao caso o administrador nao seja criado
    if (authError || !authData.user) {
      await supabase
        .from('organizations')
        .delete()
        .eq('id', organizationId).select().single();

      // Emite erro caso o email do administrador já esteja registado
      if (authError instanceof AuthApiError) {
        throw new BusinessError(ERROR_CODES.EMAIL_ALREADY_EXISTS);
      }
      throw new DBError();
    }

    // Insere na tabela de usuarios
    const { error: userError } = await supabase
      .from('users')
      .insert([{
        id: authData.user.id,
        name: request.adminName,
        email: request.adminEmail,
        organization_id: organizationId,
        role: 'admin'
      }]);

    if (userError) throw new DBError();

    // Faz o logout do usuário (permite com que mais de uma organização seja criada)
    await supabase.auth.signOut();

    return organization;
  }
}
