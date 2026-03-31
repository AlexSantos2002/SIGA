import { Injectable } from '@angular/core';
import {supabase} from '../../../supabase/supabase';
import { CreateUserRequest } from '../models/CreateUserRequest';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  /**
   * Regista um usuario com seu email, password e organizacao
   * @param email
   * @param password
   * @param organizationId
   */
  async signUp(email: string, password: string, organizationId: string) {
    // Faz o signup com as credenciais
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (authError) throw authError;

    // Insere na tabela "users"
    const { error: tableError } = await supabase
      .from('users')
      .insert([{ id: authData.user?.id, organization_id: organizationId }]);
    if (tableError) throw tableError;

    return authData.user;
  }


  /**
   * Regista um administrador.
   * O registo do administrador é feito assim que a
   * organização é criada
   * @param request
   */
  async registerAdmin(request: CreateUserRequest) {
    const {name, email, password, organizationId} = request;

    // Faz o registo no supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (authError) throw authError;
    if (!authData.user) throw new Error('Usuário não foi criado');

    // Insere o administrador na tabela "users"
    const { error: tableError } = await supabase
      .from('users')
      .insert([{
        id: authData.user.id,
        name,
        email,
        organization_id: organizationId,
        role: 'admin'
      }]);
    if (tableError) throw tableError;

    return authData.user;
  }
}
