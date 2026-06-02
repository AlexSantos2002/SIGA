import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { Adopter } from '../../../../models/adopter/adopter.model';
import { AdoptersService } from '../../../../services/adopter/adopters.service';
import { AdopterForm } from '../adopter-form/adopter-form';
import {
  buildAdopterRequest,
  createAdopterForm,
  patchAdopterForm,
  validateFlagReason,
} from '../adopter-form.helpers';

@Component({
  selector: 'app-edit-adopter',
  standalone: true,
  imports: [CommonModule, RouterModule, AdopterForm],
  templateUrl: './edit-adopter.html',
  styleUrl: '../adopter-form.css',
})
export class EditAdopter implements OnInit {
  adopter: Adopter | null = null;
  adopterId = '';
  form: FormGroup;

  isLoading = true;
  isSubmitting = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private adopterService: AdoptersService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = createAdopterForm(this.fb);
  }

  async ngOnInit(): Promise<void> {
    this.adopterId = this.route.snapshot.paramMap.get('id') || '';

    if (!this.adopterId) {
      this.errorMessage = 'Adotante nao encontrado.';
      this.isLoading = false;
      return;
    }

    await this.loadAdopter();
  }

  private async loadAdopter(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      this.cdr.detectChanges();

      this.adopter = await this.adopterService.getById(this.adopterId);
      patchAdopterForm(this.form, this.adopter);
    } catch (error: any) {
      console.error('Erro ao carregar adotante:', error);
      this.errorMessage =
        error?.message || error?.details || 'Nao foi possivel carregar o adotante.';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
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

      await this.adopterService.update(this.adopterId, buildAdopterRequest(this.form));

      await this.router.navigate(['/app/adopters']);
    } catch (error: any) {
      console.error('Erro ao atualizar adotante:', error);
      this.errorMessage =
        error?.message || error?.details || 'Nao foi possivel atualizar o adotante.';
    } finally {
      this.isSubmitting = false;
      this.cdr.detectChanges();
    }
  }
}
