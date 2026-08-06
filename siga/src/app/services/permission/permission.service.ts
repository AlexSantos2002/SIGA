import { Injectable } from '@angular/core';

import { BusinessError } from '../../error/app-error';
import { ERROR_CODES } from '../../error/error-codes';
import { PermissionKey } from '../../constants/permissions';
import { User } from '../../models/user/user.model';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  constructor(private authService: AuthService) {}

  can(permission: PermissionKey): boolean {
    return this.canUser(this.authService.getCurrentUser(), permission);
  }

  canAny(permissions: PermissionKey[]): boolean {
    return permissions.some((permission) => this.can(permission));
  }

  canUser(user: User | null, permission: PermissionKey): boolean {
    if (!user || !user.isActive) {
      return false;
    }

    if (user.role === 'admin') {
      return true;
    }

    return user.permissions?.[permission] === true;
  }

  assert(permission: PermissionKey): void {
    if (!this.can(permission)) {
      throw new BusinessError(ERROR_CODES.PERMISSION_DENIED);
    }
  }
}
