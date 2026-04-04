import { Injectable } from '@angular/core';
import {supabase} from '../../../supabase/supabase';
import { LoginRequest } from '../models/LoginRequest';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../models/User';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  async login(request: LoginRequest): Promise<User> {
    // Faz o login no supabase auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: request.email,
      password: request.password
    });

    if (error) throw error;

    // Busca o usuario da tabela "users"
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (userError) throw userError;

    const user = this.mapToUser(userProfile);

    this.currentUserSubject.next(user);

    return user;
  }

  async logout() {
    await supabase.auth.signOut();
    this.currentUserSubject.next(null);
  }

  getCurrentUser() {
    return this.currentUserSubject.value;
  }

  // Carrega o usuario autenticado.
  // Deve ser utilizado na inicializacao da aplicacao,
  // para evitar o login constante
  async loadUserFromSession() {
    const { data } = await supabase.auth.getSession();

    if (!data.session) return;

    const userId = data.session.user.id;

    const { data: userProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    const user = this.mapToUser(userProfile);

    this.currentUserSubject.next(user);
  }

  async getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
  }

  // Converte o usuario enviado pelo supabase para um User
  private mapToUser(profile: any): User {
    return {
      name: profile.name,
      email: profile.email,
      role: profile.role,
      organizationId: profile.organization_id
    };
  }

}
