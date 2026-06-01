import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { Adopter } from '../../../../models/adopter/adopter.model';
import { UpdateAdopterRequest } from '../../../../models/adopter/update-adopter-request';
import { AdoptersService } from '../../../../services/adopter/adopters.service';

@Component({
  selector: 'app-edit-adopter',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
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
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = this.createForm();
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

  private async loadAdopter(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      this.cdr.detectChanges();

      this.adopter = await this.adopterService.getById(this.adopterId);
      this.patchForm(this.adopter);
    } catch (error: any) {
      console.error('Erro ao carregar adotante:', error);
      this.errorMessage =
        error?.message || error?.details || 'Nao foi possivel carregar o adotante.';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  private patchForm(adopter: Adopter): void {
    this.form.patchValue({
      name: adopter.name,
      lastName: adopter.lastName,
      email: adopter.email,
      phone: adopter.phone || '',
      documentType: adopter.documentType || '',
      documentNumber: adopter.documentNumber || '',
      birthDate: adopter.birthDate || null,
      address: adopter.address || '',
      city: adopter.city || '',
      postalCode: adopter.postalCode || '',
      housingType: adopter.housingType || '',
      hasOutdoorSpace: adopter.hasOutdoorSpace,
      householdMembers: adopter.householdMembers || '',
      employmentStatus: adopter.employmentStatus || '',
      hasOtherAnimals: adopter.hasOtherAnimals,
      otherAnimalsDescription: adopter.otherAnimalsDescription || '',
      experienceWithAnimals: adopter.experienceWithAnimals || '',
      preferredSpecies: adopter.preferredSpecies || '',
      adoptionMotivation: adopter.adoptionMotivation || '',
      notes: adopter.notes || '',
      isFlagged: adopter.isFlagged,
      flagReason: adopter.flagReason || '',
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

  private buildRequest(): UpdateAdopterRequest {
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

      await this.adopterService.update(this.adopterId, this.buildRequest());

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
