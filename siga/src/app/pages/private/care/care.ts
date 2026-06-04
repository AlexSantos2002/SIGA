import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { DatePicker } from '../../../components/date-picker/date-picker';
import {
  DEWORMING_TYPES,
  SelectOption,
  VACCINE_STATUSES,
  getOptionLabel,
} from '../../../constants/form-options';
import {
  AnimalCareRecord,
  AnimalCareTimelineState,
  AnimalCareType,
} from '../../../models/animal-health/animal-care-record.model';
import { Animal } from '../../../models/animal/animal.model';
import { AnimalCareService } from '../../../services/animal-health/animal-care.service';
import { AnimalDewormingService } from '../../../services/animal-health/animal-deworming.service';
import { AnimalVaccineService } from '../../../services/animal-health/animal-vaccine.service';
import { AnimalVetAppointmentService } from '../../../services/animal-health/animal-vet-appointment.service';
import { AnimalService } from '../../../services/animal/animal.service';

type CareFilterType = 'all' | AnimalCareType;
type CareFilterState = 'all' | AnimalCareTimelineState;

@Component({
  selector: 'app-care',
  standalone: true,
  imports: [CommonModule, DatePicker, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './care.html',
  styleUrl: './care.css',
})
export class Care implements OnInit, OnDestroy {
  animals: Animal[] = [];
  careRecords: AnimalCareRecord[] = [];

  form: FormGroup;

  filterType: CareFilterType = 'all';
  filterAnimalId = 'all';
  filterState: CareFilterState = 'all';

  isLoading = true;
  isSubmitting = false;
  errorMessage = '';
  deletingRecordKey: string | null = null;
  confirmingRecordKey: string | null = null;

  readonly careTypes: SelectOption[] = [
    { value: 'vaccine', label: 'Vacina' },
    { value: 'deworming', label: 'Desparasitação' },
    { value: 'appointment', label: 'Consulta / tratamento' },
  ];
  readonly vaccineStatuses = VACCINE_STATUSES;
  readonly dewormingTypes = DEWORMING_TYPES;
  readonly timelineStates: SelectOption[] = [
    { value: 'overdue', label: 'Em atraso' },
    { value: 'due_soon', label: 'Próximos 30 dias' },
    { value: 'scheduled', label: 'Agendados' },
    { value: 'completed', label: 'Concluídos sem próxima data' },
    { value: 'unscheduled', label: 'Sem data' },
  ];

  private careTypeSubscription: Subscription | null = null;

  private readonly timelinePriority: Record<AnimalCareTimelineState, number> = {
    overdue: 0,
    due_soon: 1,
    scheduled: 2,
    unscheduled: 3,
    completed: 4,
  };

  constructor(
    private fb: FormBuilder,
    private animalService: AnimalService,
    private careService: AnimalCareService,
    private vaccineService: AnimalVaccineService,
    private dewormingService: AnimalDewormingService,
    private vetAppointmentService: AnimalVetAppointmentService,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      careType: ['vaccine', Validators.required],
      animalId: ['', Validators.required],
      name: ['', [Validators.required, Validators.maxLength(120)]],
      vaccineStatus: ['pendente', Validators.required],
      dateTaken: [null],
      scheduledDate: [null],
      nextDueDate: [null],
      dewormingType: ['interna'],
      dateDone: [null],
      productName: [''],
      appointmentDate: [null],
      reason: [''],
      clinicName: [''],
      veterinarianName: [''],
      result: [''],
      nextAppointmentDate: [null],
      notes: [''],
    });

    this.careTypeSubscription =
      this.form.get('careType')?.valueChanges.subscribe((type) => {
        this.updateCareTypeValidators(type);
      }) ?? null;

    this.updateCareTypeValidators(this.careType);
  }

  async ngOnInit(): Promise<void> {
    await this.loadPageData();
  }

  ngOnDestroy(): void {
    this.careTypeSubscription?.unsubscribe();
  }

  get careType(): AnimalCareType {
    const type = this.form.get('careType')?.value;

    return this.isCareType(type) ? type : 'vaccine';
  }

  get filteredCareRecords(): AnimalCareRecord[] {
    return this.careRecords
      .filter((record) => this.matchesFilters(record))
      .sort((firstRecord, secondRecord) => this.compareCareRecords(firstRecord, secondRecord));
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
    this.updateCareTypeValidators(this.careType);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    try {
      this.isSubmitting = true;
      this.errorMessage = '';
      this.cdr.detectChanges();

      await this.createCareRecord();
      this.resetForm();
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
        await this.vaccineService.confirmTaken(record.id, this.getTodayDate());
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

  getTimelineState(record: AnimalCareRecord): AnimalCareTimelineState {
    const alertDate = this.getAlertDate(record);

    if (!alertDate) {
      return record.status === 'completed' ? 'completed' : 'unscheduled';
    }

    const daysUntil = this.getDaysUntil(alertDate);

    if (daysUntil < 0) {
      return 'overdue';
    }

    if (daysUntil <= 30) {
      return 'due_soon';
    }

    return 'scheduled';
  }

  getTimelineLabel(record: AnimalCareRecord): string {
    const labels: Record<AnimalCareTimelineState, string> = {
      overdue: 'Em atraso',
      due_soon: 'Próximo',
      scheduled: 'Agendado',
      completed: 'Concluído',
      unscheduled: 'Sem data',
    };

    return labels[this.getTimelineState(record)];
  }

  getTimelineDescription(record: AnimalCareRecord): string {
    const alertDate = this.getAlertDate(record);

    if (!alertDate) {
      return record.status === 'completed'
        ? 'Sem próxima data registada'
        : 'Ainda sem data prevista';
    }

    const daysUntil = this.getDaysUntil(alertDate);

    if (daysUntil < 0) {
      return `${Math.abs(daysUntil)} dia(s) em atraso`;
    }

    if (daysUntil === 0) {
      return 'Marcado para hoje';
    }

    return `Faltam ${daysUntil} dia(s)`;
  }

  getRecordKey(record: AnimalCareRecord): string {
    return `${record.type}:${record.id}`;
  }

  getAnimalOptionLabel(animal: Animal): string {
    const description = [animal.species?.name, animal.breed?.name].filter(Boolean).join(' / ');

    return description ? `${animal.name} - ${description}` : animal.name;
  }

  getAnimalDescription(record: AnimalCareRecord): string {
    return [record.animal.speciesName, record.animal.breedName].filter(Boolean).join(' / ') || '-';
  }

  getAlertDate(record: AnimalCareRecord): string | null {
    if (record.status === 'pending') {
      return record.scheduledDate || record.nextDueDate;
    }

    return record.nextDueDate;
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
    const notes = this.toNullableString(this.form.value.notes);

    if (this.careType === 'vaccine') {
      await this.vaccineService.create({
        animalId,
        name: this.form.value.name.trim(),
        status: this.form.value.vaccineStatus,
        dateTaken: this.toNullableString(this.form.value.dateTaken),
        scheduledDate: this.toNullableString(this.form.value.scheduledDate),
        nextDueDate: this.toNullableString(this.form.value.nextDueDate),
        notes,
      });
      return;
    }

    if (this.careType === 'deworming') {
      await this.dewormingService.create({
        animalId,
        type: this.form.value.dewormingType,
        dateDone: this.form.value.dateDone,
        nextDueDate: this.toNullableString(this.form.value.nextDueDate),
        productName: this.toNullableString(this.form.value.productName),
        notes,
      });
      return;
    }

    await this.vetAppointmentService.create({
      animalId,
      appointmentDate: this.form.value.appointmentDate,
      reason: this.form.value.reason.trim(),
      clinicName: this.toNullableString(this.form.value.clinicName),
      veterinarianName: this.toNullableString(this.form.value.veterinarianName),
      result: this.toNullableString(this.form.value.result),
      nextAppointmentDate: this.toNullableString(this.form.value.nextAppointmentDate),
      notes,
    });
  }

  private updateCareTypeValidators(typeValue: unknown): void {
    const type = this.isCareType(typeValue) ? typeValue : 'vaccine';
    const controlsToReset = [
      'name',
      'vaccineStatus',
      'dateTaken',
      'scheduledDate',
      'nextDueDate',
      'dewormingType',
      'dateDone',
      'productName',
      'appointmentDate',
      'reason',
      'clinicName',
      'veterinarianName',
      'result',
      'nextAppointmentDate',
    ];

    controlsToReset.forEach((controlName) => {
      this.form.get(controlName)?.clearValidators();
      this.form.get(controlName)?.updateValueAndValidity({ emitEvent: false });
    });

    if (type === 'vaccine') {
      this.form.get('name')?.setValidators([Validators.required, Validators.maxLength(120)]);
      this.form.get('vaccineStatus')?.setValidators([Validators.required]);
    }

    if (type === 'deworming') {
      this.form.get('dewormingType')?.setValidators([Validators.required]);
      this.form.get('dateDone')?.setValidators([Validators.required]);
    }

    if (type === 'appointment') {
      this.form.get('appointmentDate')?.setValidators([Validators.required]);
      this.form.get('reason')?.setValidators([Validators.required, Validators.maxLength(160)]);
    }

    controlsToReset.forEach((controlName) => {
      this.form.get(controlName)?.updateValueAndValidity({ emitEvent: false });
    });
  }

  private resetForm(): void {
    const careType = this.careType;

    this.form.reset({
      careType,
      animalId: '',
      name: '',
      vaccineStatus: 'pendente',
      dateTaken: null,
      scheduledDate: null,
      nextDueDate: null,
      dewormingType: 'interna',
      dateDone: null,
      productName: '',
      appointmentDate: null,
      reason: '',
      clinicName: '',
      veterinarianName: '',
      result: '',
      nextAppointmentDate: null,
      notes: '',
    });
    this.updateCareTypeValidators(careType);
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  private matchesFilters(record: AnimalCareRecord): boolean {
    const matchesType = this.filterType === 'all' || record.type === this.filterType;
    const matchesAnimal = this.filterAnimalId === 'all' || record.animalId === this.filterAnimalId;
    const matchesState =
      this.filterState === 'all' || this.getTimelineState(record) === this.filterState;

    return matchesType && matchesAnimal && matchesState;
  }

  private compareCareRecords(
    firstRecord: AnimalCareRecord,
    secondRecord: AnimalCareRecord,
  ): number {
    const firstState = this.getTimelineState(firstRecord);
    const secondState = this.getTimelineState(secondRecord);
    const stateResult = this.timelinePriority[firstState] - this.timelinePriority[secondState];

    if (stateResult !== 0) {
      return stateResult;
    }

    const firstDate = this.getSortDate(firstRecord);
    const secondDate = this.getSortDate(secondRecord);

    if (firstDate && secondDate && firstDate !== secondDate) {
      return firstDate.localeCompare(secondDate);
    }

    if (firstDate && !secondDate) {
      return -1;
    }

    if (!firstDate && secondDate) {
      return 1;
    }

    return firstRecord.createdAt.localeCompare(secondRecord.createdAt);
  }

  private getSortDate(record: AnimalCareRecord): string | null {
    return this.getAlertDate(record) || record.completedDate || record.createdAt || null;
  }

  private getDaysUntil(dateValue: string): number {
    const targetDate = this.parseDateOnly(dateValue);

    if (!targetDate) {
      return 0;
    }

    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const millisecondsPerDay = 1000 * 60 * 60 * 24;

    return Math.round((targetDate.getTime() - todayDate.getTime()) / millisecondsPerDay);
  }

  private getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private parseDateOnly(dateValue: string): Date | null {
    const [year, month, day] = dateValue.split('-').map((part) => Number(part));

    if (!year || !month || !day) {
      return null;
    }

    return new Date(year, month - 1, day);
  }

  private toNullableString(value: string | null | undefined): string | null {
    const trimmedValue = value?.trim();

    return trimmedValue ? trimmedValue : null;
  }

  private isCareType(value: unknown): value is AnimalCareType {
    return value === 'vaccine' || value === 'deworming' || value === 'appointment';
  }
}
