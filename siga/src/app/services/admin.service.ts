import { Injectable } from '@angular/core';
import { supabase } from '../../../supabase/supabase';
import { CreateUserRequest } from '../models/CreateUserRequest';

@Injectable({
  providedIn: 'root',
})
export class AdminService {

  async registerUser(request: CreateUserRequest) {
    // Verifica se e um administrador
    const { data, error } = await supabase.auth.getUser();

    if (error || !data) throw new Error('Usuário não autenticado');

    // Cria o usuario no supabase auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: request.email,
      password: request.password
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Usuário não foi criado');

    // Insere na tabela de usuarios
    const { error: userError } = await supabase
      .from('users')
      .insert([{
        id: authData.user.id,
        name: request.name,
        email: request.email,
        organization_id: request.organizationId,
        role: 'admin'
      }]);

  }

}
