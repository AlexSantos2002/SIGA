import { Injectable } from '@angular/core';
import { AuthApiError, User as SupabaseUser } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { supabase } from '../../../../supabase/supabase';
import { AuthenticationError, DBError } from '../../error/app-error';
import { ERROR_CODES } from '../../error/error-codes';
import { LoginRequest } from '../../models/auth/login-request';
import { User } from '../../models/user/user.model';
import { OrganizationService } from '../organization/organization.service';

/**
 * Servico responsavel pela autenticacao e gestao do utilizador autenticado.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  constructor(private organizationService: OrganizationService) {}

  async login(request: LoginRequest): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: this.normalizeEmail(request.email),
      password: request.password,
    });

    if (error) {
      if (error instanceof AuthApiError && this.isEmailNotConfirmedError(error)) {
        throw new AuthenticationError(ERROR_CODES.EMAIL_NOT_CONFIRMED);
      }

      throw new AuthenticationError(ERROR_CODES.INVALID_CREDENTIALS);
    }

    const user = await this.resolveUserProfile(data.user);

    if (!user) {
      await this.logout();
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }

    this.currentUserSubject.next(user);

    return user;
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut();
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getCurrentOrganizationId(): string | null {
    return this.currentUserSubject.value?.organizationId ?? null;
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  async loadUserFromSession(): Promise<void> {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
      this.currentUserSubject.next(null);
      return;
    }

    try {
      const user = await this.resolveUserProfile(data.session.user);

      if (!user) {
        await this.logout();
        return;
      }

      this.currentUserSubject.next(user);
    } catch (err) {
      console.error('Erro ao restaurar sessao:', err);
      await this.logout();
    }
  }

  private async resolveUserProfile(authUser: SupabaseUser): Promise<User | null> {
    const existingUser = await this.getUserProfile(authUser.id);

    if (existingUser) {
      return existingUser;
    }

    await this.organizationService.completePendingOrganizationRegistration(authUser);

    return this.getUserProfile(authUser.id);
  }

  private async getUserProfile(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw new AuthenticationError(ERROR_CODES.AUTHENTICATION_ERROR);
    }

    if (!data) {
      console.warn('Perfil nao encontrado em public.users para o utilizador:', userId);
      return null;
    }

    return this.mapToUser(data);
  }

  private mapToUser(profile: any): User {
    return {
      name: profile.name,
      email: profile.email,
      role: profile.role,
      organizationId: profile.organization_id,
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private isEmailNotConfirmedError(error: AuthApiError): boolean {
    return error.code === 'email_not_confirmed' || error.message.toLowerCase().includes('email not confirmed');
  }
}
