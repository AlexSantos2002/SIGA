import {Component, OnInit} from '@angular/core';
import { OrganizationService } from '../../../services/organization.service';
import { FormBuilder, FormsModule, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RegisterOrganizationRequest } from '../../../models/RegisterOrganizationRequest';

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
      // Organizacao
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
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

    const request: RegisterOrganizationRequest = this.form.value;

    try {
      const org = await this.organizationService.registerOrganization(request);
      console.log('Organização registada');
      this.form.reset();

      // Redirecionar para a pagina da organizacao

    } catch (err) {
      console.log('Erro: ', err);

      // Implementar mensagem de erro
    }
  }

}
