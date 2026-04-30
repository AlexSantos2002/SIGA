import { Injectable} from '@angular/core';
import {supabase} from '../../../../supabase/supabase';
import {RegisterOrganizationRequest} from '../../models/auth/register-organization-request';

@Injectable({
  providedIn: 'root',
})
export class OrganizationService {

  // TODO: Modificar tabela de organizações para ter o ID do administrador

  /**
   * @description
   * Cria uma organizacao com nome, email, numero e morada
   * Cria tambem o administrador principal da organizacao
   */
  async registerOrganization(request: RegisterOrganizationRequest) {

    // Cria a organizacao
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert([{
        name: request.name,
        phone: request.phone,
        email: request.email,
        address: request.address
      }])
      .select()
      .single();

    if (orgError) throw orgError;

    const organizationId = orgData.id;

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
        .eq('id', organizationId);

      throw authError;
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

    if (userError) throw userError;

    return orgData;
  }
}
