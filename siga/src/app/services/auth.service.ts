import { Injectable } from '@angular/core';
import {supabase} from '../../../supabase/supabase';

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
}
