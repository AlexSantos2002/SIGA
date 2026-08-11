import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AdoptersService } from '../../../../services/adopter/adopters.service';
import { LoadingService } from '../../../../services/services/loading.service';
import { AdopterForm } from '../adopter-form/adopter-form';
import {
  buildAdopterRequest,
  createAdopterForm,
  validateFlagReason,
} from '../adopter-form.helpers';

@Component({
  selector: 'app-add-adopter',
  standalone: true,
  imports: [CommonModule, RouterModule, AdopterForm],
  templateUrl: './add-adopter.html',
  styleUrl: '../adopter-form.css',
})
export class AddAdopter {
  form: FormGroup;

  isSubmitting = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private adopterService: AdoptersService,
    private loading: LoadingService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = createAdopterForm(this.fb);
  }

  async submit(): Promise<void> {
    const isFlagReasonValid = validateFlagReason(this.form);

    if (this.form.invalid || !isFlagReasonValid) {
      this.form.markAllAsTouched();
      return;
    }

    try {
      this.isSubmitting = true;
      this.errorMessage = '';
      this.cdr.detectChanges();
      this.loading.start();

      await this.adopterService.register(buildAdopterRequest(this.form));

      await this.router.navigate(['/app/adopters']);
    } catch (error: any) {
      console.error('Erro ao registar adotante:', error);
      this.errorMessage =
        error?.message || error?.details || 'Nao foi possivel registar o adotante.';
    } finally {
      this.loading.stop();
      this.isSubmitting = false;
      this.cdr.detectChanges();
    }
  }
}
