import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import {
  ADOPTER_HOUSING_TYPES,
  SelectOption,
  getOptionLabel,
} from '../../../constants/form-options';
import { PERMISSIONS } from '../../../constants/permissions';
import { Adopter } from '../../../models/adopter/adopter.model';
import { AdoptersService } from '../../../services/adopter/adopters.service';
import { PermissionService } from '../../../services/permission/permission.service';
import { LoadingService } from '../../../services/services/loading.service';
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

interface AdopterFilters {
  search: string;
  city: string;
  phone: string;
  housingType: string;
  status: string;
  outdoorSpace: string;
  otherAnimals: string;
}

@Component({
  selector: 'app-adopters',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './adopters.html',
  styleUrl: './adopters.css',
})
export class Adopters implements OnInit {
  adopters: Adopter[] = [];

  filters: AdopterFilters = {
    search: '',
    city: '',
    phone: '',
    housingType: '',
    status: '',
    outdoorSpace: '',
    otherAnimals: '',
  };

  readonly housingTypeOptions = ADOPTER_HOUSING_TYPES;
  readonly permissions = PERMISSIONS;

  sortState: SortState<AdopterSortField> = createSortState();

  isLoading = true;
  errorMessage = '';

  isDeleteModalOpen = false;
  adopterToDelete: Adopter | null = null;
  deletingAdopterId: string | null = null;

  constructor(
    private adopterService: AdoptersService,
    public permissionService: PermissionService,
    private loading: LoadingService,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadAdopters();
  }

  get sortedAdopters(): Adopter[] {
    return sortItems(this.filteredAdopters, this.sortState, this.adopterSortConfig);
  }

  get filteredAdopters(): Adopter[] {
    return this.adopters.filter((adopter) => this.matchesFilters(adopter));
  }

  get cityOptions(): SelectOption[] {
    return this.getUniqueOptions(
      this.adopters
        .map((adopter) => adopter.city)
        .filter((city): city is string => !!city),
    );
  }

  get hasActiveFilters(): boolean {
    return Object.values(this.filters).some((value) => value.trim() !== '');
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
      this.loading.start();

      this.adopters = await this.adopterService.getAll();
    } catch (error: any) {
      console.error('Erro ao carregar adotantes:', error);
      this.errorMessage =
        error?.message || error?.details || 'Nao foi possivel carregar os adotantes.';
    } finally {
      this.loading.stop();
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
      this.loading.start();

      await this.adopterService.delete(adopterId);

      this.adopters = this.adopters.filter((adopter) => adopter.id !== adopterId);

      this.adopterToDelete = null;
      this.isDeleteModalOpen = false;
    } catch (error: any) {
      console.error('Erro ao eliminar adotante:', error);
      this.errorMessage =
        error?.message || error?.details || 'Nao foi possivel eliminar o adotante.';
    } finally {
      this.loading.stop();
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

  resetFilters(): void {
    this.filters = {
      search: '',
      city: '',
      phone: '',
      housingType: '',
      status: '',
      outdoorSpace: '',
      otherAnimals: '',
    };
  }

  private matchesFilters(adopter: Adopter): boolean {
    const search = this.normalize(this.filters.search);
    const phone = this.normalize(this.filters.phone);

    if (search) {
      const searchableText = [
        this.getFullName(adopter),
        adopter.email,
        adopter.phone,
        adopter.documentNumber,
        adopter.address,
        adopter.city,
        adopter.postalCode,
        adopter.preferredSpecies,
        adopter.notes,
        adopter.flagReason,
      ]
        .map((value) => this.normalize(value))
        .join(' ');

      if (!searchableText.includes(search)) {
        return false;
      }
    }

    if (this.filters.city && adopter.city !== this.filters.city) {
      return false;
    }

    if (phone && !this.normalize(adopter.phone).includes(phone)) {
      return false;
    }

    if (this.filters.housingType && adopter.housingType !== this.filters.housingType) {
      return false;
    }

    if (this.filters.status === 'flagged' && !adopter.isFlagged) {
      return false;
    }

    if (this.filters.status === 'active' && adopter.isFlagged) {
      return false;
    }

    if (this.filters.outdoorSpace === 'yes' && !adopter.hasOutdoorSpace) {
      return false;
    }

    if (this.filters.outdoorSpace === 'no' && adopter.hasOutdoorSpace) {
      return false;
    }

    if (this.filters.otherAnimals === 'yes' && !adopter.hasOtherAnimals) {
      return false;
    }

    if (this.filters.otherAnimals === 'no' && adopter.hasOtherAnimals) {
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
