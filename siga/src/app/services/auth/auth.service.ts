import { Injectable } from '@angular/core';
import { supabase } from '../../../../supabase/supabase';
import { LoginRequest } from '../../models/auth/login-request';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../../models/user/user.model';
import { AuthenticationError, DBError } from '../../error/app-error';
import { ERROR_CODES } from '../../error/error-codes';

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
      password: request.password,
    });

    if (error) {
      throw new AuthenticationError(ERROR_CODES.INVALID_CREDENTIALS);
    }

    const user = await this.getUserProfile(data.user.id);

    if (!user) {
      await this.logout();

      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }

    this.currentUserSubject.next(user);

    return user;
  }

  /**
   * Termina a sessão do utilizador autenticado.
   */
  async logout(): Promise<void> {
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
   * Retorna o ID da organização a qual o utilizador
   * autenticado pertence
   */
  getCurrentOrganizationId(): string | null {
    return this.currentUserSubject.value?.organizationId ?? null;
  }

  /**
   * Indica se existe um utilizador autenticado.
   */
  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  /**
   * Carrega o utilizador a partir da sessão persistida do Supabase.
   * Evita que o utilizador tenha de fazer login novamente.
   *
   * Deve ser utilizado na inicialização da aplicação.
   */
  async loadUserFromSession(): Promise<void> {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
      this.currentUserSubject.next(null);
      return;
    }

    const userId = data.session.user.id;

    const user = await this.getUserProfile(userId);

    if (!user) {
      await this.logout();
      return;
    }

    this.currentUserSubject.next(user);
  }

  /**
   * Busca o perfil do utilizador na base de dados.
   *
   * Usa maybeSingle() em vez de single() para evitar erro 406 quando
   * o utilizador existe no Auth, mas ainda não existe em public.users.
   */
  private async getUserProfile(userId: string): Promise<User | null> {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();

    if (error) {
      throw new AuthenticationError(ERROR_CODES.AUTHENTICATION_ERROR);
    }

    if (!data) {
      console.warn('Perfil não encontrado em public.users para o utilizador:', userId);

      return null;
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
      organizationId: profile.organization_id,
    };
  }
}
