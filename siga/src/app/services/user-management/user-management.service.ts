import { Injectable } from '@angular/core';

import { supabase } from '../../../../supabase/supabase';
import { PermissionMap } from '../../constants/permissions';
import { AuthenticationError, DBError } from '../../error/app-error';
import { ERROR_CODES } from '../../error/error-codes';
import { User } from '../../models/user/user.model';
import { withTimeout } from '../../utils/utils';
import { AuthService } from '../auth/auth.service';
import { PermissionService } from '../permission/permission.service';

export interface OrganizationUser extends User {
  createdAt: string;
}

export interface CreateOrganizationUserRequest {
  name: string;
  email: string;
  password: string;
  permissions: PermissionMap;
}

export interface UpdateOrganizationUserRequest {
  id: string;
  name: string;
  permissions: PermissionMap;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class UserManagementService {
  constructor(
    private authService: AuthService,
    private permissionService: PermissionService,
  ) {}

  async getUsers(): Promise<OrganizationUser[]> {
    this.permissionService.assert('users.view');

    const organizationId = this.authService.getCurrentOrganizationId();

    if (!organizationId) {
      throw new AuthenticationError(ERROR_CODES.NOT_AUTHENTICATED);
    }

    const { data, error } = await withTimeout<any>(
      supabase
        .from('users')
        .select('id,name,email,role,organization_id,permissions,is_active,created_at')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: true }),
    );

    if (error) {
      throw new DBError(ERROR_CODES.UNABLE_TO_GET_USERS);
    }

    return (data ?? []).map((profile: any) => this.mapUser(profile));
  }

  async createUser(request: CreateOrganizationUserRequest): Promise<void> {
    this.permissionService.assert('users.create');

    const { error } = await supabase.functions.invoke('bright-responder', {
      body: {
        name: request.name.trim(),
        email: this.normalizeEmail(request.email),
        password: request.password,
        permissions: request.permissions,
      },
    });

    if (error) {
      throw new Error(await this.getFunctionErrorMessage(error));
    }
  }

  async updateUser(request: UpdateOrganizationUserRequest): Promise<void> {
    this.permissionService.assert('users.update');

    const organizationId = this.authService.getCurrentOrganizationId();

    if (!organizationId) {
      throw new AuthenticationError(ERROR_CODES.NOT_AUTHENTICATED);
    }

    const { error } = await withTimeout<any>(
      supabase
        .from('users')
        .update({
          name: request.name.trim(),
          permissions: request.permissions,
          is_active: request.isActive,
        })
        .eq('id', request.id)
        .eq('organization_id', organizationId)
        .neq('role', 'admin'),
    );

    if (error) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }
  }

  async deactivateUser(userId: string): Promise<void> {
    this.permissionService.assert('users.deactivate');

    const organizationId = this.authService.getCurrentOrganizationId();
    const currentUser = this.authService.getCurrentUser();

    if (!organizationId) {
      throw new AuthenticationError(ERROR_CODES.NOT_AUTHENTICATED);
    }

    if (currentUser?.id === userId) {
      throw new DBError(ERROR_CODES.INVALID_CHANGE);
    }

    const { error } = await withTimeout<any>(
      supabase.rpc('siga_deactivate_organization_user', { target_user_id: userId }),
    );

    if (error) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }
  }

  private mapUser(profile: any): OrganizationUser {
    return {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      organizationId: profile.organization_id,
      permissions: profile.permissions ?? {},
      isActive: profile.is_active ?? true,
      createdAt: profile.created_at,
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private async getFunctionErrorMessage(error: any): Promise<string> {
    if (error?.name === 'FunctionsFetchError' || error?.message === 'Failed to send a request to the Edge Function') {
      return 'Não foi possível contactar o serviço de criação de utilizadores. Confirma que a Edge Function bright-responder está publicada no projeto Supabase configurado na aplicação.';
    }

    const response = error?.context;

    if (response instanceof Response) {
      try {
        const body = await response.clone().json();
        if (typeof body?.error === 'string' && body.error.trim()) {
          return body.error;
        }
      } catch {
        // A network error may not include a JSON response body.
      }
    }

    return error?.message || ERROR_MESSAGES_FALLBACK;
  }
}

const ERROR_MESSAGES_FALLBACK = 'Não foi possível criar o utilizador. Verifica a configuração da Supabase.';
