import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  PERMISSIONS,
  PERMISSION_OPTIONS,
  PermissionKey,
  PermissionMap,
  PermissionOption,
} from '../../../constants/permissions';
import { AuthService } from '../../../services/auth/auth.service';
import { PermissionService } from '../../../services/permission/permission.service';
import { LoadingService } from '../../../services/services/loading.service';
import {
  OrganizationUser,
  UserManagementService,
} from '../../../services/user-management/user-management.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users implements OnInit {
  users: OrganizationUser[] = [];
  editingUser: OrganizationUser | null = null;

  form: FormGroup;

  readonly permissions = PERMISSION_OPTIONS;
  readonly permissionKeys = PERMISSIONS;
  readonly groups = Array.from(new Set(PERMISSION_OPTIONS.map((permission) => permission.group)));

  isLoading = true;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private userManagementService: UserManagementService,
    private authService: AuthService,
    public permissionService: PermissionService,
    private loading: LoadingService,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(80)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      isActive: [true],
      permissions: this.fb.group(this.createPermissionControls()),
    });
  }

  async ngOnInit(): Promise<void> {
    await this.loadUsers();
  }

  get isEditing(): boolean {
    return !!this.editingUser;
  }

  get currentUserId(): string | null {
    return this.authService.getCurrentUser()?.id ?? null;
  }

  get canCreateUsers(): boolean {
    return this.permissionService.can(this.permissionKeys.usersCreate);
  }

  get canUpdateUsers(): boolean {
    return this.permissionService.can(this.permissionKeys.usersUpdate);
  }

  get canDeactivateUsers(): boolean {
    return this.permissionService.can(this.permissionKeys.usersDeactivate);
  }

  getPermissionsByGroup(group: string): PermissionOption[] {
    return this.permissions.filter((permission) => permission.group === group);
  }

  startCreate(): void {
    if (!this.canCreateUsers) {
      return;
    }

    this.editingUser = null;
    this.errorMessage = '';
    this.successMessage = '';
    this.form.reset({
      name: '',
      email: '',
      password: '',
      isActive: true,
      permissions: this.createEmptyPermissionMap(),
    });
    this.form.get('email')?.enable();
    this.form.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
    this.form.get('password')?.updateValueAndValidity();
  }

  startEdit(user: OrganizationUser): void {
    if (!this.canUpdateUsers || user.role === 'admin') {
      return;
    }

    this.editingUser = user;
    this.errorMessage = '';
    this.successMessage = '';
    this.form.reset({
      name: user.name,
      email: user.email,
      password: '',
      isActive: user.isActive,
      permissions: this.createEmptyPermissionMap(user.permissions),
    });
    this.form.get('email')?.disable();
    this.form.get('password')?.clearValidators();
    this.form.get('password')?.updateValueAndValidity();
  }

  async submit(): Promise<void> {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }

    if ((this.editingUser && !this.canUpdateUsers) || (!this.editingUser && !this.canCreateUsers)) {
      return;
    }

    try {
      this.isSubmitting = true;
      this.errorMessage = '';
      this.successMessage = '';
      this.cdr.detectChanges();
      this.loading.start();

      if (this.editingUser) {
        await this.userManagementService.updateUser({
          id: this.editingUser.id,
          name: this.form.value.name,
          isActive: this.form.value.isActive,
          permissions: this.getSelectedPermissions(),
        });
        this.successMessage = 'Utilizador atualizado.';
      } else {
        await this.userManagementService.createUser({
          name: this.form.value.name,
          email: this.form.value.email,
          password: this.form.value.password,
          permissions: this.getSelectedPermissions(),
        });
        this.successMessage = 'Utilizador criado.';
      }

      await this.loadUsers();
      this.startCreate();
    } catch (error: any) {
      console.error('Erro ao guardar utilizador:', error);
      this.errorMessage = error?.message || error?.details || 'Nao foi possivel guardar o utilizador.';
    } finally {
      this.loading.stop();
      this.isSubmitting = false;
      this.cdr.detectChanges();
    }
  }

  async deactivate(user: OrganizationUser): Promise<void> {
    if (!this.canDeactivateUsers || user.role === 'admin' || user.id === this.currentUserId) {
      return;
    }

    try {
      this.errorMessage = '';
      this.loading.start();
      await this.userManagementService.deactivateUser(user.id);
      await this.loadUsers();
      if (this.editingUser?.id === user.id) {
        this.startCreate();
      }
    } catch (error: any) {
      console.error('Erro ao desativar utilizador:', error);
      this.errorMessage = error?.message || error?.details || 'Nao foi possivel desativar o utilizador.';
      this.cdr.detectChanges();
    } finally {
      this.loading.stop();
    }
  }

  hasPermission(user: OrganizationUser, permission: PermissionKey): boolean {
    return user.role === 'admin' || user.permissions?.[permission] === true;
  }

  private async loadUsers(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      this.cdr.detectChanges();
      this.loading.start();
      this.users = await this.userManagementService.getUsers();
    } catch (error: any) {
      console.error('Erro ao carregar utilizadores:', error);
      this.errorMessage = error?.message || error?.details || 'Nao foi possivel carregar os utilizadores.';
    } finally {
      this.loading.stop();
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  private createPermissionControls(): Record<PermissionKey, boolean> {
    return this.permissions.reduce<Record<PermissionKey, boolean>>((controls, permission) => {
      controls[permission.key] = false;
      return controls;
    }, {} as Record<PermissionKey, boolean>);
  }

  private createEmptyPermissionMap(values: PermissionMap = {}): PermissionMap {
    return this.permissions.reduce<PermissionMap>((permissions, permission) => {
      permissions[permission.key] = values[permission.key] === true;
      return permissions;
    }, {});
  }

  private getSelectedPermissions(): PermissionMap {
    const values = this.form.getRawValue().permissions ?? {};

    return this.permissions.reduce<PermissionMap>((permissions, permission) => {
      permissions[permission.key] = values[permission.key] === true;
      return permissions;
    }, {});
  }
}
