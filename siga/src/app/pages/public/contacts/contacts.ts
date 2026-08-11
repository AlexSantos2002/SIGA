import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoadingService } from '../../../services/services/loading.service';

/**
 * @description
 * Componente responsável pela página de contactos
 */
@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contacts.html',
  styleUrl: './contacts.css',
})
export class Contacts {
  form: FormGroup;
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private loading: LoadingService,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(120)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(160)]],
      subject: ['', [Validators.required, Validators.maxLength(160)]],
      message: ['', [Validators.required, Validators.maxLength(4000)]],
      website: [''],
    });
  }

  async sendMessage(): Promise<void> {
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

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.form.value),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.ok) {
        throw new Error(result?.message || $localize`:@@contact.error.message:Ocorreu um erro ao enviar a mensagem. Tente novamente mais tarde.`);
      }

      this.successMessage = $localize`:@@contact.success.message:A sua mensagem foi enviada com sucesso. Entraremos em contacto brevemente.`;

      this.form.reset({
        name: '',
        email: '',
        subject: '',
        message: '',
        website: '',
      });
    } catch (error) {
      this.errorMessage =
        error instanceof Error
          ? error.message
          : $localize`:@@contact.error.message:Ocorreu um erro ao enviar a mensagem. Tente novamente mais tarde.`;
    } finally {
      this.loading.stop();
      this.isSubmitting = false;
      this.cdr.detectChanges();
    }
  }

  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);

    return !!control && control.invalid && (control.touched || control.dirty);
  }

  clearFeedback(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }
}
