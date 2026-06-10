import { ChangeDetectorRef, Component } from '@angular/core';
import { OrganizationService } from '../../../services/organization/organization.service';
import {
  FormBuilder,
  FormsModule,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  ValidatorFn,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { RegisterOrganizationRequest } from '../../../models/auth/register-organization-request';
import { CommonModule } from '@angular/common';
import { AppError } from '../../../error/app-error';
import { Router, RouterLink } from '@angular/router';

/**
 * @description
 * Componente responsável pelo registo de organizações na plataforma SIGA através de um formulario utilizadno reactive forms
 *
 */
@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, FormsModule, CommonModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
  standalone: true,
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
    private organizationService: OrganizationService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group(
      {
        // Organização
        name: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', [Validators.required, Validators.pattern(/^[0-9]{9}$/)]],
        address: ['', [Validators.required]],

        // Admin
        adminName: ['', [Validators.required, Validators.minLength(3)]],
        adminEmail: ['', [Validators.required, Validators.email]],
        adminPassword: ['', [Validators.required, Validators.minLength(6)]],
        adminPasswordConfirm: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator },
    );
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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    const request: RegisterOrganizationRequest = this.form.value;

    try {
      const result = await this.organizationService.registerOrganization(request);
      this.form.reset();

      if (result.requiresEmailConfirmation) {
        this.successMessage =
          'Conta criada. Verifique o seu email e clique no link enviado para confirmar a conta antes de iniciar sessao.';
        return;
      }

      await this.router.navigate(['/login']);
    } catch (err) {
      if (err instanceof AppError) {
        this.errorMessage = err.message;
      } else {
        this.errorMessage = 'Nao foi possivel realizar a operacao.';
      }
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
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
