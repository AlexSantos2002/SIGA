import { Component, OnInit } from '@angular/core';
import { OrganizationService } from '../../../services/organization.service';
import { RegisterOrganizationRequest } from '../../../models/RegisterOrganizationRequest';

@Component({
  selector: 'app-organizations',
  standalone: true,
  imports: [],
  templateUrl: './organizations.html',
  styleUrl: './organizations.css',
})
export class Organizations {
  constructor(private organizationService: OrganizationService) {}
}
