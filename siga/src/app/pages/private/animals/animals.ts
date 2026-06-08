import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

import {
  ANIMAL_GENDER_LABELS,
  ANIMAL_STATUS_LABELS,
  getMappedLabel,
} from '../../../constants/form-options';
import { Animal } from '../../../models/animal/animal.model';
import { AnimalService } from '../../../services/animal/animal.service';
import { ImageService } from '../../../services/image.service';
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

@Component({
  selector: 'app-animals',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './animals.html',
  styleUrl: './animals.css',
})
export class Animals implements OnInit {
  animals: Animal[] = [];

  sortState: SortState<AnimalSortField> = createSortState();

  isLoading = true;
  errorMessage = '';

  deletingAnimalId: string | null = null;
  animalToDelete: Animal | null = null;
  isDeleteModalOpen = false;

  constructor(
    private animalService: AnimalService,
    private imageService: ImageService,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadAnimals();
  }

  get sortedAnimals(): Animal[] {
    return sortItems(this.animals, this.sortState, this.animalSortConfig);
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

  getAnimalImageUrl(animal: Animal): string | null {
    return this.imageService.getAnimalImage(animal.imagePath);
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
