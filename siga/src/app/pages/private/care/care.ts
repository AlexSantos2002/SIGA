import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { DatePicker } from '../../../components/date-picker/date-picker';
import {
  DEWORMING_TYPES,
  SelectOption,
  VACCINE_STATUSES,
  getOptionLabel, CARE_TYPES
} from '../../../constants/form-options';
import {
  AnimalCareRecord,
  AnimalCareType,
} from '../../../models/animal-health/animal-care-record.model';
import { Animal } from '../../../models/animal/animal.model';
import { AnimalCareService } from '../../../services/animal-health/animal-care.service';
import { AnimalDewormingService } from '../../../services/animal-health/animal-deworming.service';
import { AnimalVaccineService } from '../../../services/animal-health/animal-vaccine.service';
import { AnimalVetAppointmentService } from '../../../services/animal-health/animal-vet-appointment.service';
import { AnimalService } from '../../../services/animal/animal.service';
import { getTodayDate, toNullableString } from '../../../utils/utils';
import {
  createCareForm,
  getCareTypeFromForm,
  resetCareForm,
  updateCareTypeValidators,
} from './care-form.helpers';
import {
  CareFilterState,
  CareFilterType,
  compareCareRecords,
  getAlertDate,
  getCareRecordKey,
  getTimelineDescription,
  getTimelineLabel,
  getTimelineState,
  matchesCareFilters,
} from './care-timeline.helpers';

@Component({
  selector: 'app-care',
  standalone: true,
  imports: [CommonModule, DatePicker, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './care.html',
  styleUrl: './care.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Care implements OnInit, OnDestroy {
  animals: Animal[] = [];
  careRecords: AnimalCareRecord[] = [];

  form: FormGroup;

  filterType: CareFilterType = 'all';
  filterAnimalId = 'all';
  filterState: CareFilterState = 'all';
  currentPage = 1;

  isLoading = true;
  isSubmitting = false;
  errorMessage = '';
  deletingRecordKey: string | null = null;
  confirmingRecordKey: string | null = null;

  readonly careTypes = CARE_TYPES;
  readonly vaccineStatuses = VACCINE_STATUSES;
  readonly dewormingTypes = DEWORMING_TYPES;
  readonly timelineStates: SelectOption[] = [
    { value: 'overdue', label: 'Em atraso' },
    { value: 'due_soon', label: 'Próximos 30 dias' },
    { value: 'scheduled', label: 'Agendados' },
    { value: 'completed', label: 'Concluídos sem próxima data' },
    { value: 'unscheduled', label: 'Sem data' },
  ];
  readonly getTimelineState = getTimelineState;
  readonly getTimelineLabel = getTimelineLabel;
  readonly getTimelineDescription = getTimelineDescription;
  readonly getRecordKey = getCareRecordKey;
  readonly getAlertDate = getAlertDate;
  readonly pageSize = 10;

  private careTypeSubscription: Subscription | null = null;
  private vaccineStatusSubscription: Subscription | null = null;

  constructor(
    private fb: FormBuilder,
    private animalService: AnimalService,
    private careService: AnimalCareService,
    private vaccineService: AnimalVaccineService,
    private dewormingService: AnimalDewormingService,
    private vetAppointmentService: AnimalVetAppointmentService,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = createCareForm(this.fb);

    this.careTypeSubscription =
      this.form.get('careType')?.valueChanges.subscribe((type) => {
        updateCareTypeValidators(this.form, type);
      }) ?? null;
    this.vaccineStatusSubscription =
      this.form.get('vaccineStatus')?.valueChanges.subscribe(() => {
        updateCareTypeValidators(this.form, this.careType);
      }) ?? null;

    updateCareTypeValidators(this.form, this.careType);
  }

  async ngOnInit(): Promise<void> {
    await this.loadPageData();
  }

  ngOnDestroy(): void {
    this.careTypeSubscription?.unsubscribe();
    this.vaccineStatusSubscription?.unsubscribe();
  }

  get careType(): AnimalCareType {
    return getCareTypeFromForm(this.form);
  }

  get filteredCareRecords(): AnimalCareRecord[] {
    return this.careRecords
      .filter((record) =>
        matchesCareFilters(record, {
          animalId: this.filterAnimalId,
          state: this.filterState,
          type: this.filterType,
        }),
      )
      .sort(compareCareRecords);
  }

  get animalsAvailableForCare(): Animal[] {
    return this.animals.filter((animal) => this.canRegisterCareForAnimal(animal));
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredCareRecords.length / this.pageSize));
  }

  get paginatedCareRecords(): AnimalCareRecord[] {
    this.ensureCurrentPage();

    const startIndex = (this.currentPage - 1) * this.pageSize;

    return this.filteredCareRecords.slice(startIndex, startIndex + this.pageSize);
  }

  get pageStart(): number {
    if (this.filteredCareRecords.length === 0) {
      return 0;
    }

    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get pageEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredCareRecords.length);
  }

  get hasPreviousPage(): boolean {
    return this.currentPage > 1;
  }

  get hasNextPage(): boolean {
    return this.currentPage < this.totalPages;
  }

  get overdueCount(): number {
    return this.careRecords.filter((record) => this.getTimelineState(record) === 'overdue').length;
  }

  get dueSoonCount(): number {
    return this.careRecords.filter((record) => this.getTimelineState(record) === 'due_soon').length;
  }

  get pendingCount(): number {
    return this.careRecords.filter((record) => record.status === 'pending').length;
  }

  get completedCount(): number {
    return this.careRecords.filter((record) => record.status === 'completed').length;
  }

  async submitCare(): Promise<void> {
    updateCareTypeValidators(this.form, this.careType);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    try {
      this.isSubmitting = true;
      this.errorMessage = '';
      this.cdr.detectChanges();

      await this.createCareRecord();
      resetCareForm(this.form, this.careType);
      this.careRecords = await this.careService.getAll();
    } catch (error: any) {
      console.error('Erro ao registar cuidado:', error);
      this.errorMessage =
        error?.message || error?.details || 'Não foi possível registar o cuidado.';
    } finally {
      this.isSubmitting = false;
      this.cdr.detectChanges();
    }
  }

  async deleteRecord(record: AnimalCareRecord): Promise<void> {
    const recordKey = this.getRecordKey(record);

    try {
      this.deletingRecordKey = recordKey;
      this.errorMessage = '';
      this.cdr.detectChanges();

      if (record.type === 'vaccine') {
        await this.vaccineService.delete(record.id);
      }

      if (record.type === 'deworming') {
        await this.dewormingService.delete(record.id);
      }

      if (record.type === 'appointment') {
        await this.vetAppointmentService.delete(record.id);
      }

      this.careRecords = this.careRecords.filter(
        (careRecord) => this.getRecordKey(careRecord) !== recordKey,
      );
    } catch (error: any) {
      console.error('Erro ao remover cuidado:', error);
      this.errorMessage = error?.message || error?.details || 'Não foi possível remover o cuidado.';
    } finally {
      this.deletingRecordKey = null;
      this.cdr.detectChanges();
    }
  }

  async confirmRecord(record: AnimalCareRecord): Promise<void> {
    if (record.status === 'completed') {
      return;
    }

    const recordKey = this.getRecordKey(record);

    try {
      this.confirmingRecordKey = recordKey;
      this.errorMessage = '';
      this.cdr.detectChanges();

      if (record.type === 'vaccine') {
        await this.vaccineService.confirmTaken(record.id, getTodayDate());
      }

      if (record.type === 'appointment') {
        await this.vetAppointmentService.confirmCompleted(record.id);
      }

      this.careRecords = await this.careService.getAll();
    } catch (error: any) {
      console.error('Erro ao confirmar cuidado:', error);
      this.errorMessage =
        error?.message || error?.details || 'Não foi possível confirmar o cuidado.';
    } finally {
      this.confirmingRecordKey = null;
      this.cdr.detectChanges();
    }
  }

  getCareTypeLabel(type: AnimalCareType): string {
    return getOptionLabel(this.careTypes, type);
  }

  getAnimalOptionLabel(animal: Animal): string {
    const description = [animal.species?.name, animal.breed?.name].filter(Boolean).join(' / ');

    return description ? `${animal.name} - ${description}` : animal.name;
  }

  getAnimalDescription(record: AnimalCareRecord): string {
    return [record.animal.speciesName, record.animal.breedName].filter(Boolean).join(' / ') || '-';
  }

  onCareFiltersChange(): void {
    this.currentPage = 1;
  }

  previousPage(): void {
    if (!this.hasPreviousPage) {
      return;
    }

    this.currentPage -= 1;
  }

  nextPage(): void {
    if (!this.hasNextPage) {
      return;
    }

    this.currentPage += 1;
  }

  trackByAnimalId(_index: number, animal: Animal): string {
    return animal.id;
  }

  trackByRecordKey(_index: number, record: AnimalCareRecord): string {
    return this.getRecordKey(record);
  }

  private async loadPageData(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      this.cdr.detectChanges();

      const [animals, careRecords] = await Promise.all([
        this.animalService.getAnimalsFromCurrentOrganization(),
        this.careService.getAll(),
      ]);

      this.animals = animals;
      this.careRecords = careRecords;
    } catch (error: any) {
      console.error('Erro ao carregar cuidados:', error);
      this.errorMessage =
        error?.message || error?.details || 'Não foi possível carregar os cuidados.';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  private async createCareRecord(): Promise<void> {
    const animalId = this.form.value.animalId;
    const notes = toNullableString(this.form.value.notes);
    const animal = this.animals.find((registeredAnimal) => registeredAnimal.id === animalId);

    if (!animal || !this.canRegisterCareForAnimal(animal)) {
      throw new Error('Selecionar um animal ativo para registar o cuidado.');
    }

    if (this.careType === 'vaccine') {
      await this.vaccineService.create({
        animalId,
        name: this.form.value.name.trim(),
        status: this.form.value.vaccineStatus,
        dateTaken: toNullableString(this.form.value.dateTaken),
        scheduledDate: toNullableString(this.form.value.scheduledDate),
        nextDueDate: toNullableString(this.form.value.nextDueDate),
        notes,
      });
      return;
    }

    if (this.careType === 'deworming') {
      await this.dewormingService.create({
        animalId,
        type: this.form.value.dewormingType,
        dateDone: this.form.value.dateDone,
        nextDueDate: toNullableString(this.form.value.nextDueDate),
        productName: toNullableString(this.form.value.productName),
        notes,
      });
      return;
    }

    await this.vetAppointmentService.create({
      animalId,
      appointmentDate: this.form.value.appointmentDate,
      reason: this.form.value.reason.trim(),
      clinicName: toNullableString(this.form.value.clinicName),
      veterinarianName: toNullableString(this.form.value.veterinarianName),
      result: toNullableString(this.form.value.result),
      nextAppointmentDate: toNullableString(this.form.value.nextAppointmentDate),
      notes,
    });
  }

  private canRegisterCareForAnimal(animal: Animal): boolean {
    return animal.status !== 'adotado';
  }

  private ensureCurrentPage(): void {
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    if (this.currentPage < 1) {
      this.currentPage = 1;
    }
  }
}
