import { Injectable} from '@angular/core';
import {supabase} from '../../../supabase/supabase';
import {RegisterOrganizationRequest} from '../models/RegisterOrganizationRequest';

/**
 * Serviço responsável por tarefas relacionadas a organização
 *
 */
@Injectable({
  providedIn: 'root',
})
export class OrganizationService {

  /**
   * Regista uma organizacao com nome, email, numero e morada
   * Cria tambem o administrador principal da organizacao
   */
  async registerOrganization(request: RegisterOrganizationRequest) {

    // Cria a organizacao
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert([{
        name: request.name,
        phone: request.phone,
        address: request.address
      }])
      .select();

    if (orgError) throw orgError;

    const organizationId = orgData[0].id;

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

    return orgData[0];
  }


  /**
   * Retorna as organizacoes disponiveis
   */
  async getOrganizations() {
    const { data, error } = await supabase.from('organizations').select('*');
    if (error) throw error;
    return data;
  }
}
