import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  ValidatorFn,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { DatePicker } from '../../../components/date-picker/date-picker';
import {
  ADOPTER_DOCUMENT_TYPES,
  ADOPTER_EMPLOYMENT_STATUSES,
  ADOPTER_HOUSING_TYPES,
  ADOPTER_PREFERRED_SPECIES,
  ANIMAL_GENDER_LABELS,
  getMappedLabel,
} from '../../../constants/form-options';
import { Adoption } from '../../../models/adoption/adoption.model';
import { RegisterAdopterRequest } from '../../../models/adopter/register-adopter-request';
import { Adopter } from '../../../models/adopter/adopter.model';
import { Animal } from '../../../models/animal/animal.model';
import { AdoptionService } from '../../../services/adoption/adoption.service';
import { AdoptersService } from '../../../services/adopter/adopters.service';
import { AnimalService } from '../../../services/animal/animal.service';
import {
  createSortState,
  getInitialSortDirection,
  getNextSortState,
  getSortAriaLabel,
  getSortIndicator,
  SortConfig,
  SortState,
  sortItems,
} from '../../../utils/table-sort';

type CompletedAdoptionSortField = 'animal' | 'adopter' | 'contact' | 'decisionDate' | 'status';

@Component({
  selector: 'app-adoptions',
  standalone: true,
  imports: [CommonModule, DatePicker, ReactiveFormsModule, RouterModule],
  templateUrl: './adoptions.html',
  styleUrl: './adoptions.css',
})
export class Adoptions implements OnInit, OnDestroy {
  adoptions: Adoption[] = [];
  animals: Animal[] = [];
  adopters: Adopter[] = [];

  form: FormGroup;

  isLoading = true;
  isSubmitting = false;
  errorMessage = '';
  updatingAdoptionId: string | null = null;

  completedSortState: SortState<CompletedAdoptionSortField> = createSortState();

  readonly documentTypes = ADOPTER_DOCUMENT_TYPES;
  readonly housingTypes = ADOPTER_HOUSING_TYPES;
  readonly employmentStatuses = ADOPTER_EMPLOYMENT_STATUSES;
  readonly preferredSpecies = ADOPTER_PREFERRED_SPECIES;

  private adopterModeSubscription: Subscription | null = null;

  private readonly newAdopterValidators: Record<string, ValidatorFn[]> = {
    name: [Validators.required, Validators.maxLength(80)],
    lastName: [Validators.required, Validators.maxLength(80)],
    email: [Validators.required, Validators.email, Validators.maxLength(120)],
    phone: [Validators.required, Validators.maxLength(30)],
    documentType: [],
    documentNumber: [Validators.maxLength(40)],
    birthDate: [],
    address: [Validators.maxLength(180)],
    city: [Validators.maxLength(80)],
    postalCode: [Validators.maxLength(20)],
    housingType: [],
    householdMembers: [],
    employmentStatus: [],
    otherAnimalsDescription: [],
    experienceWithAnimals: [],
    preferredSpecies: [],
    adoptionMotivation: [],
    notes: [],
  };

  constructor(
    private fb: FormBuilder,
    private adoptionService: AdoptionService,
    private adoptersService: AdoptersService,
    private animalService: AnimalService,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      animalId: ['', Validators.required],
      adopterMode: ['', Validators.required],
      existingAdopterId: [''],
      name: [''],
      lastName: [''],
      email: [''],
      phone: [''],
      documentType: [''],
      documentNumber: [''],
      birthDate: [null],
      address: [''],
      city: [''],
      postalCode: [''],
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
    });

    this.adopterModeSubscription =
      this.form.get('adopterMode')?.valueChanges.subscribe((mode) => {
        this.updateAdopterModeValidators(mode);
      }) ?? null;

    this.updateAdopterModeValidators('');
  }

  async ngOnInit(): Promise<void> {
    await this.loadPageData();
  }

  ngOnDestroy(): void {
    this.adopterModeSubscription?.unsubscribe();
  }

  get pendingAdoptions(): Adoption[] {
    return this.adoptions.filter((adoption) => adoption.status === 'pendente');
  }

  get completedAdoptions(): Adoption[] {
    return this.adoptions.filter((adoption) => adoption.status !== 'pendente');
  }

  get sortedCompletedAdoptions(): Adoption[] {
    return sortItems(
      this.completedAdoptions,
      this.completedSortState,
      this.completedAdoptionSortConfig,
    );
  }

  get completedSortField(): CompletedAdoptionSortField | null {
    return this.completedSortState.field;
  }

  get availableAnimals(): Animal[] {
    const pendingAnimalIds = new Set(this.pendingAdoptions.map((adoption) => adoption.animal.id));

    return this.animals.filter(
      (animal) =>
        animal.available &&
        (!animal.status || animal.status === 'por_adotar') &&
        !pendingAnimalIds.has(animal.id),
    );
  }

  get isNewAdopterMode(): boolean {
    return this.form.value.adopterMode === 'new';
  }

  get isExistingAdopterMode(): boolean {
    return this.form.value.adopterMode === 'existing';
  }

  sortCompletedBy(field: CompletedAdoptionSortField): void {
    this.completedSortState = getNextSortState(
      this.completedSortState,
      field,
      getInitialSortDirection(this.completedAdoptionSortConfig, field),
    );
  }

  getCompletedSortIndicator(field: CompletedAdoptionSortField): string {
    return getSortIndicator(this.completedSortState, field);
  }

  getCompletedSortAriaLabel(label: string, field: CompletedAdoptionSortField): string {
    return getSortAriaLabel(label, this.completedSortState, field);
  }

  async startProcess(): Promise<void> {
    this.updateAdopterModeValidators(this.form.value.adopterMode);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    try {
      this.isSubmitting = true;
      this.errorMessage = '';
      this.cdr.detectChanges();

      const adopterId = await this.resolveAdopterId();

      await this.adoptionService.register({
        animalId: this.form.value.animalId,
        adopterId,
        status: 'pendente',
        applicationDate: new Date().toISOString(),
      });

      this.resetForm();
      await this.loadPageData();
    } catch (error: any) {
      console.error('Erro ao iniciar processo de adocao:', error);
      this.errorMessage =
        error?.message || error?.details || 'Nao foi possivel iniciar o processo de adocao.';
    } finally {
      this.isSubmitting = false;
      this.cdr.detectChanges();
    }
  }

  async concludeProcess(
    adoption: Adoption,
    newStatus: 'aceita' | 'rejeitada' | 'devolvida',
  ): Promise<void> {
    try {
      this.updatingAdoptionId = adoption.id;
      this.errorMessage = '';
      this.cdr.detectChanges();

      await this.adoptionService.update({
        adoptionId: adoption.id,
        newStatus,
        ...(newStatus === 'devolvida' ? {} : { decisionDate: new Date().toISOString() }),
      });

      await this.loadPageData();
    } catch (error: any) {
      console.error('Erro ao concluir processo de adocao:', error);
      this.errorMessage =
        error?.message || error?.details || 'Nao foi possivel concluir o processo de adocao.';
    } finally {
      this.updatingAdoptionId = null;
      this.cdr.detectChanges();
    }
  }

  getAdopterFullName(adopter: Adopter): string {
    const fullName = `${adopter.name} ${adopter.lastName}`.trim();

    return fullName || adopter.email || '-';
  }

  getAdopterLabel(adopter: Adopter): string {
    const name = this.getAdopterFullName(adopter);

    return adopter.email ? `${name} - ${adopter.email}` : name;
  }

  getAnimalLabel(animal: Animal): string {
    const species = animal.species?.name;
    const breed = animal.breed?.name;
    const description = [species, breed].filter(Boolean).join(' / ');

    return description ? `${animal.name} - ${description}` : animal.name;
  }

  getAnimalDescription(adoption: Adoption): string {
    const species = adoption.animal.species?.name;
    const breed = adoption.animal.breed?.name;

    return [species, breed].filter(Boolean).join(' / ') || '-';
  }

  getGenderLabel(gender: string | null | undefined): string {
    return getMappedLabel(ANIMAL_GENDER_LABELS, gender);
  }

  getStatusLabel(status: Adoption['status']): string {
    const labels: Record<Adoption['status'], string> = {
      pendente: 'Em aberto',
      aceita: 'Concluído',
      rejeitada: 'Rejeitado',
      devolvida: 'Devolvido',
    };

    return labels[status];
  }

  getProcessDate(adoption: Adoption): string | null {
    return adoption.decisionDate || adoption.applicationDate || null;
  }

  private async loadPageData(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      this.cdr.detectChanges();

      const [adoptions, animals, adopters] = await Promise.all([
        this.adoptionService.getAll(),
        this.animalService.getAnimalsFromCurrentOrganization(),
        this.adoptersService.getAll(),
      ]);

      this.adoptions = adoptions;
      this.animals = animals;
      this.adopters = adopters;
    } catch (error: any) {
      console.error('Erro ao carregar processos de adocao:', error);
      this.errorMessage =
        error?.message || error?.details || 'Nao foi possivel carregar os processos de adocao.';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  private async resolveAdopterId(): Promise<string> {
    if (this.form.value.adopterMode === 'existing') {
      return this.form.value.existingAdopterId;
    }

    const adopter = await this.adoptersService.register(this.buildAdopterRequest());

    return adopter.id;
  }

  private buildAdopterRequest(): RegisterAdopterRequest {
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
      isFlagged: false,
      flagReason: null,
    };
  }

  private updateAdopterModeValidators(mode: string): void {
    const existingAdopterControl = this.form.get('existingAdopterId');

    Object.keys(this.newAdopterValidators).forEach((controlName) => {
      this.form.get(controlName)?.clearValidators();
      this.form.get(controlName)?.updateValueAndValidity({ emitEvent: false });
    });

    if (mode === 'existing') {
      existingAdopterControl?.setValidators([Validators.required]);
    } else {
      existingAdopterControl?.clearValidators();
      existingAdopterControl?.setValue('', { emitEvent: false });
    }

    if (mode === 'new') {
      Object.entries(this.newAdopterValidators).forEach(([controlName, validators]) => {
        this.form.get(controlName)?.setValidators(validators);
        this.form.get(controlName)?.updateValueAndValidity({ emitEvent: false });
      });
    }

    existingAdopterControl?.updateValueAndValidity({ emitEvent: false });
  }

  private resetForm(): void {
    this.form.reset({
      animalId: '',
      adopterMode: '',
      existingAdopterId: '',
      name: '',
      lastName: '',
      email: '',
      phone: '',
      documentType: '',
      documentNumber: '',
      birthDate: null,
      address: '',
      city: '',
      postalCode: '',
      housingType: '',
      hasOutdoorSpace: false,
      householdMembers: '',
      employmentStatus: '',
      hasOtherAnimals: false,
      otherAnimalsDescription: '',
      experienceWithAnimals: '',
      preferredSpecies: '',
      adoptionMotivation: '',
      notes: '',
    });
    this.updateAdopterModeValidators('');
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  private toNullableString(value: string | null | undefined): string | null {
    const trimmedValue = value?.trim();

    return trimmedValue ? trimmedValue : null;
  }

  private readonly completedStatusPriority: Record<Adoption['status'], number> = {
    pendente: 0,
    aceita: 1,
    devolvida: 2,
    rejeitada: 3,
  };

  private readonly completedAdoptionSortConfig: SortConfig<Adoption, CompletedAdoptionSortField> = {
    animal: {
      value: (adoption) => adoption.animal.name,
    },
    adopter: {
      value: (adoption) => this.getAdopterFullName(adoption.adopter),
    },
    contact: {
      value: (adoption) => adoption.adopter.phone || adoption.adopter.city || null,
    },
    decisionDate: {
      value: (adoption) => this.getProcessDate(adoption),
      type: 'date',
    },
    status: {
      value: (adoption) => this.getStatusLabel(adoption.status),
      priority: (adoption) => this.completedStatusPriority[adoption.status],
    },
  };
}
