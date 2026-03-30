import { Component } from '@angular/core';
import { OrganizationService } from '../../../services/organization.service';

@Component({
  selector: 'app-organizations',
  standalone: true,
  imports: [],
  templateUrl: './organizations.html',
  styleUrl: './organizations.css',
})
export class Organizations {
  constructor(private organizationService: OrganizationService) {}

  name: string = 'organizacao de animais';
  email: string = 'organizacao';
  phone: string = '123456789';
  address: string = 'Porto';

  registerOrganization(): void {
    this.organizationService.createOrganization(
      this.name,
      this.email,
      this.phone,
      this.address
    );
  }
}