import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ANIMAL_STATUS_LABELS, getMappedLabel } from '../../../constants/form-options';
import { Adoption } from '../../../models/adoption/adoption.model';
import {
  AnimalCareRecord,
  AnimalCareTimelineState,
  AnimalCareType,
} from '../../../models/animal-health/animal-care-record.model';
import { Adopter } from '../../../models/adopter/adopter.model';
import { Animal } from '../../../models/animal/animal.model';
import { AdoptionService } from '../../../services/adoption/adoption.service';
import { AdoptersService } from '../../../services/adopter/adopters.service';
import { AnimalCareService } from '../../../services/animal-health/animal-care.service';
import { AnimalService } from '../../../services/animal/animal.service';
import { AuthService } from '../../../services/auth/auth.service';
import {
  compareCareRecords,
  getAlertDate,
  getTimelineDescription,
  getTimelineLabel,
  getTimelineState,
} from '../care/care-timeline.helpers';

interface DashboardNotice {
  title: string;
  description: string;
  count: number;
  route: string;
  severity: 'danger' | 'warning' | 'info';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit {
  animals: Animal[] = [];
  adoptions: Adoption[] = [];
  adopters: Adopter[] = [];
  careRecords: AnimalCareRecord[] = [];

  isLoading = true;
  errorMessage = '';

  readonly today = new Date();

  constructor(
    private animalService: AnimalService,
    private adoptionService: AdoptionService,
    private adoptersService: AdoptersService,
    private animalCareService: AnimalCareService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadDashboardData();
  }

  get userName(): string {
    return this.authService.getCurrentUser()?.name ?? 'Equipa';
  }

  get totalAnimals(): number {
    return this.animals.length;
  }

  get availableAnimalsCount(): number {
    return this.animals.filter((animal) => animal.available).length;
  }

  get inCareAnimalsCount(): number {
    return this.animals.filter(
      (animal) => animal.status === 'em_tratamento' || animal.status === 'acolhimento',
    ).length;
  }

  get pendingAdoptions(): Adoption[] {
    return this.adoptions.filter((adoption) => adoption.status === 'pendente');
  }

  get completedAdoptionsCount(): number {
    return this.adoptions.filter((adoption) => adoption.status === 'aceita').length;
  }

  get flaggedAdopters(): Adopter[] {
    return this.adopters.filter((adopter) => adopter.isFlagged);
  }

  get activeCareRecords(): AnimalCareRecord[] {
    return this.careRecords.filter((record) => record.animal.status !== 'adotado');
  }

  get overdueCareRecords(): AnimalCareRecord[] {
    return this.activeCareRecords.filter((record) => this.getTimelineState(record) === 'overdue');
  }

  get dueSoonCareRecords(): AnimalCareRecord[] {
    return this.activeCareRecords.filter((record) => this.getTimelineState(record) === 'due_soon');
  }

  get urgentCareRecords(): AnimalCareRecord[] {
    return this.activeCareRecords
      .filter((record) => {
        const state = this.getTimelineState(record);

        return state === 'overdue' || state === 'due_soon';
      })
      .sort(compareCareRecords)
      .slice(0, 5);
  }

  get recentAnimals(): Animal[] {
    return [...this.animals]
      .sort((firstAnimal, secondAnimal) =>
        secondAnimal.createdAt.localeCompare(firstAnimal.createdAt),
      )
      .slice(0, 5);
  }

  get recentPendingAdoptions(): Adoption[] {
    return [...this.pendingAdoptions]
      .sort((firstAdoption, secondAdoption) =>
        secondAdoption.applicationDate.localeCompare(firstAdoption.applicationDate),
      )
      .slice(0, 4);
  }

  get importantNotices(): DashboardNotice[] {
    const notices: DashboardNotice[] = [];

    if (this.overdueCareRecords.length > 0) {
      notices.push({
        title: 'Cuidados em atraso',
        description: 'Vacinas, desparasitações ou consultas precisam de atenção imediata.',
        count: this.overdueCareRecords.length,
        route: '/app/care',
        severity: 'danger',
      });
    }

    if (this.dueSoonCareRecords.length > 0) {
      notices.push({
        title: 'Cuidados próximos',
        description: 'Existem cuidados marcados ou previstos para os próximos 30 dias.',
        count: this.dueSoonCareRecords.length,
        route: '/app/care',
        severity: 'warning',
      });
    }

    if (this.pendingAdoptions.length > 0) {
      notices.push({
        title: 'Processos por decidir',
        description: 'Há pedidos de adoção em aberto à espera de decisão.',
        count: this.pendingAdoptions.length,
        route: '/app/adoptions',
        severity: 'info',
      });
    }

    if (this.flaggedAdopters.length > 0) {
      notices.push({
        title: 'Adotantes sinalizados',
        description: 'Revê estes perfis antes de avançar com novos processos.',
        count: this.flaggedAdopters.length,
        route: '/app/adopters',
        severity: 'warning',
      });
    }

    if (this.totalAnimals > 0 && this.availableAnimalsCount === 0) {
      notices.push({
        title: 'Sem animais disponíveis',
        description: 'Nenhum animal está atualmente marcado como disponível para adoção.',
        count: 0,
        route: '/app/animals',
        severity: 'info',
      });
    }

    return notices;
  }

  get hasImportantNotices(): boolean {
    return this.importantNotices.length > 0;
  }

  getAnimalStatusLabel(status: string | null): string {
    return getMappedLabel(ANIMAL_STATUS_LABELS, status);
  }

  getAdopterFullName(adopter: Adopter): string {
    return `${adopter.name} ${adopter.lastName}`.trim() || adopter.email;
  }

  getAdoptionAdopterName(adoption: Adoption): string {
    return this.getAdopterFullName(adoption.adopter);
  }

  getAnimalDescription(animal: Animal): string {
    return [animal.species?.name, animal.breed?.name].filter(Boolean).join(' / ') || '-';
  }

  getAdoptionAnimalDescription(adoption: Adoption): string {
    return (
      [adoption.animal.species?.name, adoption.animal.breed?.name].filter(Boolean).join(' / ') ||
      '-'
    );
  }

  getCareRecordDescription(record: AnimalCareRecord): string {
    return [record.animal.speciesName, record.animal.breedName].filter(Boolean).join(' / ') || '-';
  }

  getCareTypeLabel(type: AnimalCareType): string {
    const labels: Record<AnimalCareType, string> = {
      vaccine: 'Vacina',
      deworming: 'Desparasitação',
      appointment: 'Consulta',
    };

    return labels[type];
  }

  getCareRecordDate(record: AnimalCareRecord): string | null {
    return getAlertDate(record) || record.completedDate || record.createdAt || null;
  }

  getTimelineState(record: AnimalCareRecord): AnimalCareTimelineState {
    return getTimelineState(record);
  }

  getTimelineLabel(record: AnimalCareRecord): string {
    return getTimelineLabel(record);
  }

  getTimelineDescription(record: AnimalCareRecord): string {
    return getTimelineDescription(record);
  }

  trackByNotice(_index: number, notice: DashboardNotice): string {
    return `${notice.route}-${notice.title}`;
  }

  trackByCareRecord(_index: number, record: AnimalCareRecord): string {
    return `${record.type}-${record.id}`;
  }

  trackByAdoptionId(_index: number, adoption: Adoption): string {
    return adoption.id;
  }

  trackByAnimalId(_index: number, animal: Animal): string {
    return animal.id;
  }

  private async loadDashboardData(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      this.cdr.detectChanges();

      const [animals, adoptions, adopters, careRecords] = await Promise.all([
        this.animalService.getAnimalsFromCurrentOrganization(),
        this.adoptionService.getAll(),
        this.adoptersService.getAll(),
        this.animalCareService.getAll(),
      ]);

      this.animals = animals;
      this.adoptions = adoptions;
      this.adopters = adopters;
      this.careRecords = careRecords;
    } catch (error: any) {
      console.error('Erro ao carregar dashboard:', error);
      this.errorMessage =
        error?.message || error?.details || 'Não foi possível carregar o dashboard.';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }
}
