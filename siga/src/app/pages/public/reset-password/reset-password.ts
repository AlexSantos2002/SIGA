import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AppError } from '../../../error/app-error';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword implements OnInit {
  form: FormGroup;
  isCheckingSession = true;
  hasRecoverySession = false;
  isSubmitting = false;
  passwordUpdated = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group(
      {
        password: ['', [Validators.required, Validators.minLength(8)]],
        passwordConfirm: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator },
    );
  }

  async ngOnInit(): Promise<void> {
    try {
      this.hasRecoverySession = await this.authService.waitForPasswordRecoverySession();

      if (!this.hasRecoverySession) {
        this.errorMessage = 'A ligação de recuperação é inválida ou expirou. Pede um novo email de recuperação.';
      }
    } catch {
      this.errorMessage = 'Não foi possível validar a ligação de recuperação.';
    } finally {
      this.isCheckingSession = false;
      this.cdr.detectChanges();
    }
  }

  async resetPassword(): Promise<void> {
    this.errorMessage = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    try {
      this.isSubmitting = true;
      this.cdr.detectChanges();

      await this.authService.updatePassword(this.form.value.password);
      await this.authService.logout();

      this.passwordUpdated = true;
      this.hasRecoverySession = false;
      this.form.reset({ password: '', passwordConfirm: '' });
    } catch (error) {
      this.errorMessage =
        error instanceof AppError
          ? error.message
          : 'Não foi possível atualizar a palavra-passe. Tente novamente mais tarde.';
    } finally {
      this.isSubmitting = false;
      this.cdr.detectChanges();
    }
  }

  clearFeedback(): void {
    this.errorMessage = '';
  }

  private passwordMatchValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
    const password = group.get('password')?.value;
    const confirm = group.get('passwordConfirm')?.value;

    if (!password || !confirm) {
      return null;
    }

    return password === confirm ? null : { passwordMismatch: true };
  };
}
