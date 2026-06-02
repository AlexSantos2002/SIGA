import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ADOPTER_HOUSING_TYPES, getOptionLabel } from '../../../constants/form-options';
import { Adopter } from '../../../models/adopter/adopter.model';
import { AdoptersService } from '../../../services/adopter/adopters.service';
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

type AdopterSortField =
  | 'name'
  | 'email'
  | 'phone'
  | 'city'
  | 'housingType'
  | 'status'
  | 'createdAt';

@Component({
  selector: 'app-adopters',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './adopters.html',
  styleUrl: './adopters.css',
})
export class Adopters implements OnInit {
  adopters: Adopter[] = [];

  sortState: SortState<AdopterSortField> = createSortState();

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

  get sortedAdopters(): Adopter[] {
    return sortItems(this.adopters, this.sortState, this.adopterSortConfig);
  }

  get sortField(): AdopterSortField | null {
    return this.sortState.field;
  }

  sortBy(field: AdopterSortField): void {
    this.sortState = getNextSortState(
      this.sortState,
      field,
      getInitialSortDirection(this.adopterSortConfig, field),
    );
  }

  getSortIndicator(field: AdopterSortField): string {
    return getSortIndicator(this.sortState, field);
  }

  getSortAriaLabel(label: string, field: AdopterSortField): string {
    return getSortAriaLabel(label, this.sortState, field);
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

  private readonly adopterSortConfig: SortConfig<Adopter, AdopterSortField> = {
    name: {
      value: (adopter) => this.getFullName(adopter),
    },
    email: {
      value: (adopter) => adopter.email,
    },
    phone: {
      value: (adopter) => adopter.phone,
    },
    city: {
      value: (adopter) => adopter.city,
    },
    housingType: {
      value: (adopter) =>
        adopter.housingType ? this.getHousingTypeLabel(adopter.housingType) : null,
    },
    status: {
      value: (adopter) => (adopter.isFlagged ? 'Sinalizado' : 'Ativo'),
      priority: (adopter) => (adopter.isFlagged ? 1 : 0),
    },
    createdAt: {
      value: (adopter) => adopter.createdAt,
      type: 'date',
      initialDirection: 'desc',
    },
  };
}
