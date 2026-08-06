import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { PermissionKey } from '../constants/permissions';
import { PermissionService } from '../services/permission/permission.service';

export const permissionGuard: CanActivateFn = (route) => {
  const permission = route.data?.['permission'] as PermissionKey | undefined;

  if (!permission || inject(PermissionService).can(permission)) {
    return true;
  }

  return inject(Router).createUrlTree(['/app/dashboard']);
};
