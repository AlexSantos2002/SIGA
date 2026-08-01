import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import {
  ANIMAL_GENDERS,
  ANIMAL_STATUSES,
  ANIMAL_GENDER_LABELS,
  ANIMAL_STATUS_LABELS,
  SelectOption,
  getMappedLabel,
} from '../../../constants/form-options';
import { Animal } from '../../../models/animal/animal.model';
import { AnimalService } from '../../../services/animal/animal.service';
import { AnimalReportService } from '../../../services/animal-report/animal-report.service';
import { ImageService } from '../../../services/image/image.service';
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

type AnimalSortField =
  | 'name'
  | 'species'
  | 'breed'
  | 'gender'
  | 'birthDate'
  | 'status'
  | 'availability'
  | 'createdAt';

interface AnimalFilters {
  search: string;
  species: string;
  breed: string;
  gender: string;
  status: string;
  availability: string;
}

@Component({
  selector: 'app-animals',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './animals.html',
  styleUrl: './animals.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Animals implements OnInit {
  animals: Animal[] = [];

  filters: AnimalFilters = {
    search: '',
    species: '',
    breed: '',
    gender: '',
    status: '',
    availability: '',
  };

  readonly genderOptions = ANIMAL_GENDERS;
  readonly statusOptions = ANIMAL_STATUSES;

  sortState: SortState<AnimalSortField> = createSortState();

  isLoading = true;
  errorMessage = '';

  deletingAnimalId: string | null = null;
  exportingAnimalId: string | null = null;
  reportErrorMessage = '';
  animalToDelete: Animal | null = null;
  isDeleteModalOpen = false;

  constructor(
    private animalService: AnimalService,
    private animalReportService: AnimalReportService,
    private imageService: ImageService,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadAnimals();
  }

  get sortedAnimals(): Animal[] {
    return sortItems(this.filteredAnimals, this.sortState, this.animalSortConfig);
  }

  get filteredAnimals(): Animal[] {
    return this.animals.filter((animal) => this.matchesFilters(animal));
  }

  get speciesOptions(): SelectOption[] {
    return this.getUniqueOptions(
      this.animals
        .map((animal) => animal.species?.name)
        .filter((species): species is string => !!species),
    );
  }

  get breedOptions(): SelectOption[] {
    return this.getUniqueOptions(
      this.animals
        .map((animal) => animal.breed?.name)
        .filter((breed): breed is string => !!breed),
    );
  }

  get hasActiveFilters(): boolean {
    return Object.values(this.filters).some((value) => value.trim() !== '');
  }

  get sortField(): AnimalSortField | null {
    return this.sortState.field;
  }

  sortBy(field: AnimalSortField): void {
    this.sortState = getNextSortState(
      this.sortState,
      field,
      getInitialSortDirection(this.animalSortConfig, field),
    );
  }

  getSortIndicator(field: AnimalSortField): string {
    return getSortIndicator(this.sortState, field);
  }

  getSortAriaLabel(label: string, field: AnimalSortField): string {
    return getSortAriaLabel(label, this.sortState, field);
  }

  openDeleteModal(animal: Animal): void {
    this.animalToDelete = animal;
    this.isDeleteModalOpen = true;
  }

  async exportAnimalReport(animal: Animal): Promise<void> {
    if (this.exportingAnimalId) {
      return;
    }

    try {
      this.exportingAnimalId = animal.id;
      this.reportErrorMessage = '';
      this.cdr.detectChanges();
      await this.animalReportService.exportAnimal(animal);
    } catch (error: any) {
      console.error('Erro ao exportar relatório do animal:', error);
      this.reportErrorMessage =
        'Não foi possível carregar todos os dados do relatório. Verifica a ligação e tenta novamente.';
    } finally {
      this.exportingAnimalId = null;
      this.cdr.detectChanges();
    }
  }

  closeDeleteModal(): void {
    if (this.deletingAnimalId) {
      return;
    }

    this.animalToDelete = null;
    this.isDeleteModalOpen = false;
  }

  async confirmDeleteAnimal(): Promise<void> {
    if (!this.animalToDelete) {
      return;
    }

    const animalId = this.animalToDelete.id;

    try {
      this.deletingAnimalId = animalId;
      this.errorMessage = '';
      this.cdr.detectChanges();

      await this.animalService.deleteAnimal(animalId);

      this.animals = this.animals.filter((animal) => animal.id !== animalId);
      this.animalToDelete = null;
      this.isDeleteModalOpen = false;
    } catch (error: any) {
      console.error('Erro ao eliminar animal:', error);
      this.errorMessage = error?.message || error?.details || 'Nao foi possivel eliminar o animal.';
    } finally {
      this.deletingAnimalId = null;
      this.cdr.detectChanges();
    }
  }

  getGenderLabel(gender: string | null): string {
    return getMappedLabel(ANIMAL_GENDER_LABELS, gender);
  }

  getStatusLabel(status: string | null): string {
    return getMappedLabel(ANIMAL_STATUS_LABELS, status);
  }

  resetFilters(): void {
    this.filters = {
      search: '',
      species: '',
      breed: '',
      gender: '',
      status: '',
      availability: '',
    };
  }

  getAnimalImageUrl(animal: Animal): string | null {
    return this.imageService.getAnimalImage(animal.imagePath);
  }

  trackByAnimalId(_index: number, animal: Animal): string {
    return animal.id;
  }

  private async loadAnimals(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      this.cdr.detectChanges();

      this.animals = await this.animalService.getAnimalsFromCurrentOrganization();
    } catch (error: any) {
      console.error('Erro na pagina Animals:', error);
      this.errorMessage =
        error?.message || error?.details || 'Nao foi possivel carregar os animais.';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  private matchesFilters(animal: Animal): boolean {
    const search = this.normalize(this.filters.search);

    if (search) {
      const searchableText = [
        animal.name,
        animal.species?.name,
        animal.breed?.name,
        animal.microchipNumber,
        animal.generalNotes,
        animal.medicalNotes,
      ]
        .map((value) => this.normalize(value))
        .join(' ');

      if (!searchableText.includes(search)) {
        return false;
      }
    }

    if (this.filters.species && animal.species?.name !== this.filters.species) {
      return false;
    }

    if (this.filters.breed && animal.breed?.name !== this.filters.breed) {
      return false;
    }

    if (this.filters.gender && animal.gender !== this.filters.gender) {
      return false;
    }

    if (this.filters.status && animal.status !== this.filters.status) {
      return false;
    }

    if (this.filters.availability === 'available' && !animal.available) {
      return false;
    }

    if (this.filters.availability === 'unavailable' && animal.available) {
      return false;
    }

    return true;
  }

  private getUniqueOptions(values: string[]): SelectOption[] {
    return Array.from(new Set(values))
      .sort((first, second) => first.localeCompare(second, 'pt', { sensitivity: 'base' }))
      .map((value) => ({ value, label: value }));
  }

  private normalize(value: string | null | undefined): string {
    return (value ?? '')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private readonly animalStatusPriority: Record<string, number> = {
    por_adotar: 0,
    em_tratamento: 1,
    acolhimento: 2,
    reservado: 3,
    indisponivel: 4,
    adotado: 5,
  };

  private readonly animalSortConfig: SortConfig<Animal, AnimalSortField> = {
    name: {
      value: (animal) => animal.name,
    },
    species: {
      value: (animal) => animal.species?.name,
    },
    breed: {
      value: (animal) => animal.breed?.name,
    },
    gender: {
      value: (animal) => (animal.gender ? this.getGenderLabel(animal.gender) : null),
    },
    birthDate: {
      value: (animal) => animal.birthDate,
      type: 'date',
      initialDirection: 'desc',
    },
    status: {
      value: (animal) => (animal.status ? this.getStatusLabel(animal.status) : null),
      priority: (animal) => (animal.status ? this.animalStatusPriority[animal.status] : undefined),
    },
    availability: {
      value: (animal) => (animal.available ? 0 : 1),
      type: 'number',
    },
    createdAt: {
      value: (animal) => animal.createdAt,
      type: 'date',
      initialDirection: 'desc',
    },
  };
}
