import {Component, OnInit} from '@angular/core';
import {OrganizationService} from '../../../services/organization.service';

@Component({
  selector: 'app-organizations',
  imports: [],
  templateUrl: './organizations.html',
  styleUrl: './organizations.css',
})
export class Organizations implements OnInit {
  constructor(private organizationService: OrganizationService) {}

  ngOnInit(): void {
    this.registerOrganization();
  }

  name: string = 'organizacao de animais';
  email: string = 'organizacao';
  phone: string = '123456789';
  address: string = 'Porto';

  registerOrganization(): void {
    this.organizationService.createOrganization(this.name, this.email, this.phone, this.address);
  }
}
