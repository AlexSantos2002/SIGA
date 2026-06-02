import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ADOPTER_HOUSING_TYPES, getOptionLabel } from '../../../constants/form-options';
import { Adopter } from '../../../models/adopter/adopter.model';
import { AdoptersService } from '../../../services/adopter/adopters.service';

@Component({
  selector: 'app-adopters',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './adopters.html',
  styleUrl: './adopters.css',
})
export class Adopters implements OnInit {
  adopters: Adopter[] = [];

  isLoading = true;
  errorMessage = '';

  isDeleteModalOpen = false;
  adopterToDelete: Adopter | null = null;
  deletingAdopterId: string | null = null;

  constructor(
    private adopterService: AdoptersService,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadAdopters();
  }

  private async loadAdopters(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      this.cdr.detectChanges();

      this.adopters = await this.adopterService.getAll();
    } catch (error: any) {
      console.error('Erro ao carregar adotantes:', error);
      this.errorMessage =
        error?.message || error?.details || 'Nao foi possivel carregar os adotantes.';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  openDeleteModal(adopter: Adopter): void {
    this.adopterToDelete = adopter;
    this.isDeleteModalOpen = true;
    this.errorMessage = '';
  }

  closeDeleteModal(): void {
    if (this.deletingAdopterId) {
      return;
    }

    this.adopterToDelete = null;
    this.isDeleteModalOpen = false;
  }

  async confirmDeleteAdopter(): Promise<void> {
    if (!this.adopterToDelete) {
      return;
    }

    const adopterId = this.adopterToDelete.id;

    try {
      this.deletingAdopterId = adopterId;
      this.errorMessage = '';
      this.cdr.detectChanges();

      await this.adopterService.delete(adopterId);

      this.adopters = this.adopters.filter((adopter) => adopter.id !== adopterId);

      this.adopterToDelete = null;
      this.isDeleteModalOpen = false;
    } catch (error: any) {
      console.error('Erro ao eliminar adotante:', error);
      this.errorMessage =
        error?.message || error?.details || 'Nao foi possivel eliminar o adotante.';
    } finally {
      this.deletingAdopterId = null;
      this.cdr.detectChanges();
    }
  }

  getFullName(adopter: Adopter | null): string {
    if (!adopter) {
      return '';
    }

    return `${adopter.name} ${adopter.lastName}`.trim();
  }

  getHousingTypeLabel(housingType: string | null | undefined): string {
    return getOptionLabel(ADOPTER_HOUSING_TYPES, housingType);
  }
}
