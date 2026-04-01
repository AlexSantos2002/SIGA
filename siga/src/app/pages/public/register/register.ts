import {supabase} from '../../../../../supabase/supabase';

import {Component, OnInit} from '@angular/core';
import { OrganizationService } from '../../../services/organization.service';
import { FormBuilder, FormsModule, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
  standalone: true
})
export class Register {

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private organizationService: OrganizationService
  ) {
    this.form = this.fb.group({
      // Organização
      name: ['', Validators.required],
      email: ['', Validators.required],
      phone: ['', Validators.required],
      address: ['', Validators.required],

      // Admin
      adminName: ['', Validators.required],
      adminEmail: ['', [Validators.required, Validators.email]],
      adminPassword: ['', Validators.required],
    });
  }

  async register() {

    if (this.form.invalid) return;

    const request = this.form.value;

    await this.organizationService.registerOrganization(request);
  }

}
