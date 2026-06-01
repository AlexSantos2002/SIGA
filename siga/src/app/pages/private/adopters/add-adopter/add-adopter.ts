import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { RegisterAdopterRequest } from '../../../../models/adopter/register-adopter-request';
import { AdoptersService } from '../../../../services/adopter/adopters.service';

@Component({
  selector: 'app-add-adopter',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './add-adopter.html',
  styleUrl: '../adopter-form.css',
})
export class AddAdopter {
  form: FormGroup;

  isSubmitting = false;
  errorMessage = '';

  documentTypes = [
    { value: 'cartao_cidadao', label: 'Cartao de cidadao' },
    { value: 'passaporte', label: 'Passaporte' },
    { value: 'titulo_residencia', label: 'Titulo de residencia' },
    { value: 'outro', label: 'Outro' },
  ];

  housingTypes = [
    { value: 'apartamento', label: 'Apartamento' },
    { value: 'moradia', label: 'Moradia' },
    { value: 'quinta', label: 'Quinta' },
    { value: 'outro', label: 'Outro' },
  ];

  employmentStatuses = [
    { value: 'empregado', label: 'Empregado' },
    { value: 'desempregado', label: 'Desempregado' },
    { value: 'estudante', label: 'Estudante' },
    { value: 'reformado', label: 'Reformado' },
    { value: 'outro', label: 'Outro' },
  ];

  preferredSpecies = [
    { value: 'cao', label: 'Cao' },
    { value: 'gato', label: 'Gato' },
    { value: 'indiferente', label: 'Indiferente' },
    { value: 'outro', label: 'Outro' },
  ];

  constructor(
    private fb: FormBuilder,
    private adopterService: AdoptersService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = this.createForm();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(80)]],
      lastName: ['', [Validators.required, Validators.maxLength(80)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
      phone: ['', [Validators.required, Validators.maxLength(30)]],
      documentType: [''],
      documentNumber: ['', Validators.maxLength(40)],
      birthDate: [null],
      address: ['', Validators.maxLength(180)],
      city: ['', Validators.maxLength(80)],
      postalCode: ['', Validators.maxLength(20)],
      housingType: [''],
      hasOutdoorSpace: [false],
      householdMembers: [''],
      employmentStatus: [''],
      hasOtherAnimals: [false],
      otherAnimalsDescription: [''],
      experienceWithAnimals: [''],
      preferredSpecies: [''],
      adoptionMotivation: [''],
      notes: [''],
      isFlagged: [false],
      flagReason: [''],
    });
  }

  private toNullableString(value: string | null | undefined): string | null {
    const trimmedValue = value?.trim();

    return trimmedValue ? trimmedValue : null;
  }

  private validateFlagReason(): boolean {
    const flagReasonControl = this.form.get('flagReason');

    if (this.form.value.isFlagged && !this.form.value.flagReason?.trim()) {
      flagReasonControl?.setErrors({ required: true });
      flagReasonControl?.markAsTouched();
      return false;
    }

    if (flagReasonControl?.hasError('required')) {
      flagReasonControl.setErrors(null);
    }

    return true;
  }

  private buildRequest(): RegisterAdopterRequest {
    return {
      name: this.form.value.name.trim(),
      lastName: this.form.value.lastName.trim(),
      email: this.form.value.email.trim(),
      phone: this.toNullableString(this.form.value.phone),
      documentType: this.toNullableString(this.form.value.documentType),
      documentNumber: this.toNullableString(this.form.value.documentNumber),
      birthDate: this.toNullableString(this.form.value.birthDate),
      address: this.toNullableString(this.form.value.address),
      city: this.toNullableString(this.form.value.city),
      postalCode: this.toNullableString(this.form.value.postalCode),
      housingType: this.toNullableString(this.form.value.housingType),
      hasOutdoorSpace: !!this.form.value.hasOutdoorSpace,
      hasOtherAnimals: !!this.form.value.hasOtherAnimals,
      otherAnimalsDescription: this.toNullableString(this.form.value.otherAnimalsDescription),
      householdMembers: this.toNullableString(this.form.value.householdMembers),
      employmentStatus: this.toNullableString(this.form.value.employmentStatus),
      experienceWithAnimals: this.toNullableString(this.form.value.experienceWithAnimals),
      preferredSpecies: this.toNullableString(this.form.value.preferredSpecies),
      adoptionMotivation: this.toNullableString(this.form.value.adoptionMotivation),
      notes: this.toNullableString(this.form.value.notes),
      isFlagged: !!this.form.value.isFlagged,
      flagReason: this.toNullableString(this.form.value.flagReason),
    };
  }

  async submit(): Promise<void> {
    const isFlagReasonValid = this.validateFlagReason();

    if (this.form.invalid || !isFlagReasonValid) {
      this.form.markAllAsTouched();
      return;
    }

    try {
      this.isSubmitting = true;
      this.errorMessage = '';
      this.cdr.detectChanges();

      await this.adopterService.register(this.buildRequest());

      await this.router.navigate(['/app/adopters']);
    } catch (error: any) {
      console.error('Erro ao registar adotante:', error);
      this.errorMessage =
        error?.message || error?.details || 'Nao foi possivel registar o adotante.';
    } finally {
      this.isSubmitting = false;
      this.cdr.detectChanges();
    }
  }
}
