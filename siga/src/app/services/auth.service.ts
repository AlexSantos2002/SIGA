import { Injectable } from '@angular/core';
import { supabase } from '../../../supabase/supabase';
import { LoginRequest } from '../models/LoginRequest';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../models/User';

/**
 * Serviço responsável pela autenticação e gestão do utilizador autenticado.
 *
 * Responsabilidades:
 * - Login / Logout
 * - Manter o utilizador atual em memória (estado global)
 * - Expor dados do utilizador (ex: organizationId, role)
 * - Restaurar sessão ao recarregar a aplicação
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {

  /**
   * BehaviorSubject mantém sempre o último valor do utilizador autenticado.
   * Permite que qualquer componente subscreva e reaja a mudanças.
   */
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  /**
   * Observable para subscrição.
   */
  currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();


  /**
   * Realiza o login de um utilizador existente.
   */
  async login(request: LoginRequest): Promise<User> {

    const { data, error } = await supabase.auth.signInWithPassword({
      email: request.email,
      password: request.password
    });

    if (error || !data.user) throw error;

    const user = await this.fetchUserProfile(data.user.id);

    this.currentUserSubject.next(user);

    return user;
  }


  /**
   * Termina a sessão do utilizador autenticado.
   */
  async logout() {
    await supabase.auth.signOut();
    this.currentUserSubject.next(null);
  }


  /**
   * Retorna o utilizador atual.
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }


  /**
   * Retorna o ID da organização do utilizador autenticado.
   */
  getOrganizationId(): string {
    const user = this.getCurrentUser();

    if (!user) {
      throw new Error('Utilizador não autenticado');
    }

    return user.organizationId;
  }


  /**
   * Indica se existe um utilizador autenticado.
   */
  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }


  /**
   * Carrega o utilizador a partir da sessão persistida do Supabase.
   * evita que o utilizador tenha de fazer login novamente
   *
   * Deve ser utilizado na inicialização da aplicação
   */
  async loadUserFromSession() {

    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) return;

    const userId = data.session.user.id;

    const user = await this.fetchUserProfile(userId);

    this.currentUserSubject.next(user);
  }


  /**
   * Busca o perfil do utilizador na base de dados.
   */
  private async fetchUserProfile(userId: string): Promise<User> {

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      throw new Error('Erro ao carregar perfil do utilizador');
    }

    return this.mapToUser(data);
  }


  /**
   * Converte o objeto da base de dados para o modelo da aplicação.
   */
  private mapToUser(profile: any): User {
    return {
      name: profile.name,
      email: profile.email,
      role: profile.role,
      organizationId: profile.organization_id
    };
  }

}
