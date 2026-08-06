import { PermissionMap } from '../../constants/permissions';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId: string;
  permissions: PermissionMap;
  isActive: boolean;
}
