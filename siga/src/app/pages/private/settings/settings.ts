import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { PERMISSIONS } from '../../../constants/permissions';
import { PermissionService } from '../../../services/permission/permission.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings {
  readonly permissions = PERMISSIONS;

  constructor(public permissionService: PermissionService) {}
}
