import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AppError } from '../../../error/app-error';
import { AuthService } from '../../../services/auth/auth.service';
import { LoadingService } from '../../../services/services/loading.service';

@Component({
  selector: 'app-recover-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './recover-password.html',
  styleUrl: './recover-password.css',
})
export class RecoverPassword {
  form: FormGroup;
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private loading: LoadingService,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  async sendRecoveryEmail(): Promise<void> {
    this.successMessage = '';
    this.errorMessage = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    try {
      this.isSubmitting = true;
      this.cdr.detectChanges();
      this.loading.start();

      await this.authService.requestPasswordReset(this.form.value.email);

      this.successMessage =
        'Se existir uma conta com este email, enviámos uma ligação para redefinir a palavra-passe.';
      this.form.reset({ email: '' });
    } catch (error) {
      this.errorMessage =
        error instanceof AppError
          ? error.message
          : 'Não foi possível enviar o email de recuperação. Tente novamente mais tarde.';
    } finally {
      this.loading.stop();
      this.isSubmitting = false;
      this.cdr.detectChanges();
    }
  }

  clearFeedback(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }
}
