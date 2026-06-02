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

@Component({
  selector: 'app-animals',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './animals.html',
  styleUrl: './animals.css',
})
export class Animals implements OnInit {
  animals: Animal[] = [];

  isLoading = true;
  errorMessage = '';

  deletingAnimalId: string | null = null;
  animalToDelete: Animal | null = null;
  isDeleteModalOpen = false;

  constructor(
    private animalService: AnimalService,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadAnimals();
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
}
