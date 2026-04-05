import { Component } from '@angular/core';
import { OrganizationService } from '../../../services/organization.service';
import {
  FormBuilder,
  FormsModule,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  ValidatorFn,
  AbstractControl, ValidationErrors
} from '@angular/forms';
import { RegisterOrganizationRequest } from '../../../models/RegisterOrganizationRequest';
import { CommonModule } from '@angular/common';

/**
 * @description
 * Componente responsável pelo registo de organizações na plataforma SIGA através de um formulario utilizadno reactive forms
 *
 */
@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
  standalone: true
})
export class Register {

  /**
   * @description
   * Formulário reativo utilizado para capturar os dados da organização
   * e do administrador.
   */
  form: FormGroup;

  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;


  /**
   * @description
   * Construtor do componente.
   * Inicializa o formulário com validações obrigatórias.
   *
   * @param fb Serviço FormBuilder utilizado para criar o formulário
   * @param organizationService Serviço responsável pela lógica de registo
   */
  constructor(
    private fb: FormBuilder,
    private organizationService: OrganizationService
  ) {
    this.form = this.fb.group({
      // Organização
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{9}$/)]],
      address: ['', [Validators.required, Validators.minLength(5)]],

      // Admin
      adminName: ['', [Validators.required, Validators.minLength(3)]],
      adminEmail: ['', [Validators.required, Validators.email]],
      adminPassword: ['', [Validators.required, Validators.minLength(6)]],
      adminPasswordConfirm: ['', [Validators.required]]
    }, {validators: this.passwordMatchValidator});
  }

  /**
   * @description
   * Submete o formulário de registo da organização.
   *
   * Valida os dados introduzidos e, caso sejam válidos,
   * envia-os para o serviço responsável pela criação da organização.
   *
   * @returns {Promise<void>} Promessa resolvida após tentativa de registo
   */
  async register(): Promise<void> {
    if (this.form.invalid) return;

    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    const request: RegisterOrganizationRequest = this.form.value;

    try {
      const org = await this.organizationService.registerOrganization(request);

      console.log('Organização registada');
      this.form.reset();

      // falta fazer:  Redirecionar para a página da organização

    } catch (err) {
      console.log('Erro: ', err);

      // falta fazer:  Implementar mensagem de erro para o utilizador
    }
  }


  /**
   * Verifica se o input contém erro
   */
  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }


  passwordMatchValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
    const password = group.get('adminPassword')?.value;
    const confirm = group.get('adminPasswordConfirm')?.value;

    return password === confirm ? null : { passwordMismatch: true };
  };

}
