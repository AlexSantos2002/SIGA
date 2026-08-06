import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import {
  ADOPTION_STATUSES,
  ANIMAL_GENDER_LABELS,
  getMappedLabel,
  getOptionLabel
} from '../../../constants/form-options';
import { PERMISSIONS } from '../../../constants/permissions';
import { Adoption } from '../../../models/adoption/adoption.model';
import { Adopter } from '../../../models/adopter/adopter.model';
import { Animal } from '../../../models/animal/animal.model';
import { AdoptionService } from '../../../services/adoption/adoption.service';
import { AdoptersService } from '../../../services/adopter/adopters.service';
import { AnimalService } from '../../../services/animal/animal.service';
import { ImageService } from '../../../services/image/image.service';
import { PermissionService } from '../../../services/permission/permission.service';
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
import {
  buildNewAdopterRequest,
  createAdoptionProcessForm,
  resetAdoptionProcessForm,
  updateAdopterModeValidators,
} from './adoptions-form.helpers';
import { AdoptionAdopterFields } from './components/adoption-adopter-fields';

type CompletedAdoptionSortField = 'animal' | 'adopter' | 'contact' | 'decisionDate' | 'status';

@Component({
  selector: 'app-adoptions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, AdoptionAdopterFields],
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
  readonly permissions = PERMISSIONS;

  private adopterModeSubscription: Subscription | null = null;

  constructor(
    private fb: FormBuilder,
    private adoptionService: AdoptionService,
    private adoptersService: AdoptersService,
    private animalService: AnimalService,
    private imageService: ImageService,
    public permissionService: PermissionService,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = createAdoptionProcessForm(this.fb);

    this.adopterModeSubscription =
      this.form.get('adopterMode')?.valueChanges.subscribe((mode) => {
        updateAdopterModeValidators(this.form, mode);
      }) ?? null;

    updateAdopterModeValidators(this.form, '');
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
    updateAdopterModeValidators(this.form, this.form.value.adopterMode);

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

      resetAdoptionProcessForm(this.form);
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

  getAnimalImageUrl(adoption: Adoption): string | null {
    return this.imageService.getAnimalImage(adoption.animal.imagePath);
  }

  getGenderLabel(gender: string | null | undefined): string {
    return getMappedLabel(ANIMAL_GENDER_LABELS, gender);
  }

  getStatusLabel(status: Adoption['status']): string {
    return getOptionLabel(ADOPTION_STATUSES, status);
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

    const adopter = await this.adoptersService.register(buildNewAdopterRequest(this.form));

    return adopter.id;
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
