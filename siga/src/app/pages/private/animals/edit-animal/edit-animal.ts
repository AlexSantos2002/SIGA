import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { Animal } from '../../../../models/animal/animal.model';
import { AnimalDeworming } from '../../../../models/animal/animal-deworming.model';
import { AnimalVetAppointment } from '../../../../models/animal/animal-vet-appointment.model';
import { AnimalVaccine } from '../../../../models/vaccines/animal-vaccines.model';

import { AnimalService } from '../../../../services/animal/animal.service';
import { AnimalDewormingService } from '../../../../services/animal-health/animal-deworming.service';
import { AnimalVetAppointmentService } from '../../../../services/animal-health/animal-vet-appointment.service';
import { AnimalVaccineService } from '../../../../services/animal-health/animal-vaccine.service';

type EditModal =
  | 'main'
  | 'notes'
  | 'health'
  | 'vaccine'
  | 'deworming'
  | 'appointment'
  | null;

@Component({
  selector: 'app-edit-animal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './edit-animal.html',
  styleUrl: './edit-animal.css',
})
export class EditAnimal implements OnInit {
  animal: Animal | null = null;
  animalId = '';

  form: FormGroup;
  vaccineForm: FormGroup;
  dewormingForm: FormGroup;
  appointmentForm: FormGroup;

  vaccines: AnimalVaccine[] = [];
  dewormingRecords: AnimalDeworming[] = [];
  vetAppointments: AnimalVetAppointment[] = [];

  isLoading = true;
  isSubmitting = false;
  errorMessage = '';

  activeModal: EditModal = null;

  statuses = [
    { value: 'por_adotar', label: 'Por adotar' },
    { value: 'em_tratamento', label: 'Em tratamento' },
    { value: 'adotado', label: 'Adotado' },
  ];

  genders = [
    { value: 'male', label: 'Macho' },
    { value: 'female', label: 'Fêmea' },
  ];

  sterilizationStatuses = [
    { value: '', label: 'Não definido' },
    { value: 'nao_realizada', label: 'Não realizada' },
    { value: 'realizada', label: 'Realizada' },
    { value: 'agendada', label: 'Agendada' },
    { value: 'nao_aplicavel', label: 'Não aplicável' },
    { value: 'desconhecido', label: 'Desconhecido' },
  ];

  vaccineStatuses = [
    { value: 'pendente', label: 'Pendente' },
    { value: 'tomada', label: 'Tomada' },
  ];

  dewormingTypes = [
    { value: 'interna', label: 'Interna' },
    { value: 'externa', label: 'Externa' },
  ];

  days = Array.from({ length: 31 }, (_, index) => index + 1);

  months = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' },
  ];

  years: number[] = [];

  constructor(
    private fb: FormBuilder,
    private animalService: AnimalService,
    private vaccineService: AnimalVaccineService,
    private dewormingService: AnimalDewormingService,
    private vetAppointmentService: AnimalVetAppointmentService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    const currentYear = new Date().getFullYear();

    this.years = Array.from(
      { length: 60 },
      (_, index) => currentYear - index
    );

    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(80)]],
      speciesName: ['', [Validators.required, Validators.maxLength(60)]],
      breedName: ['', [Validators.required, Validators.maxLength(80)]],
      gender: ['', Validators.required],
      birthDay: ['', Validators.required],
      birthMonth: ['', Validators.required],
      birthYear: ['', Validators.required],
      status: ['por_adotar', Validators.required],

      generalNotes: [''],
      medicalNotes: [''],

      sterilizationStatus: [''],
      sterilizationDate: [null],

      hasMicrochip: [false],
      microchipNumber: [''],
      microchipDate: [null],
    });

    this.vaccineForm = this.fb.group({
      name: ['', Validators.required],
      status: ['pendente', Validators.required],
      dateTaken: [null],
      scheduledDate: [null],
      nextDueDate: [null],
      notes: [''],
    });

    this.dewormingForm = this.fb.group({
      type: ['interna', Validators.required],
      dateDone: [null, Validators.required],
      nextDueDate: [null],
      productName: [''],
      notes: [''],
    });

    this.appointmentForm = this.fb.group({
      appointmentDate: [null, Validators.required],
      reason: ['', Validators.required],
      clinicName: [''],
      veterinarianName: [''],
      result: [''],
      nextAppointmentDate: [null],
      notes: [''],
    });
  }

  async ngOnInit(): Promise<void> {
    this.animalId = this.route.snapshot.paramMap.get('id') || '';

    if (!this.animalId) {
      this.errorMessage = 'Animal não encontrado.';
      this.isLoading = false;
      return;
    }

    await this.loadPageData();
  }

  private async loadPageData(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      this.cdr.detectChanges();

      const [animal, vaccines, dewormingRecords, vetAppointments] =
        await Promise.all([
          this.animalService.getAnimalFromCurrentOrganization(this.animalId),
          this.vaccineService.getByAnimalId(this.animalId),
          this.dewormingService.getByAnimalId(this.animalId),
          this.vetAppointmentService.getByAnimalId(this.animalId),
        ]);

      this.animal = animal;
      this.vaccines = vaccines;
      this.dewormingRecords = dewormingRecords;
      this.vetAppointments = vetAppointments;

      this.patchAnimalForm(animal);
    } catch (error: any) {
      console.error('Erro ao carregar ficha do animal:', error);

      this.errorMessage =
        error?.message ||
        error?.details ||
        'Não foi possível carregar a ficha do animal.';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  private patchAnimalForm(animal: Animal): void {
    const birthDateParts = this.getBirthDateParts(animal.birthDate);

    this.form.patchValue({
      name: animal.name,
      speciesName: animal.species?.name || '',
      breedName: animal.breed?.name || '',
      gender: animal.gender || '',
      birthDay: birthDateParts.day,
      birthMonth: birthDateParts.month,
      birthYear: birthDateParts.year,
      status: animal.status || 'por_adotar',

      generalNotes: animal.generalNotes || '',
      medicalNotes: animal.medicalNotes || '',

      sterilizationStatus: animal.sterilizationStatus || '',
      sterilizationDate: animal.sterilizationDate || null,

      hasMicrochip: animal.hasMicrochip || false,
      microchipNumber: animal.microchipNumber || '',
      microchipDate: animal.microchipDate || null,
    });
  }

  openModal(modal: EditModal): void {
    this.errorMessage = '';

    if (modal === 'vaccine') {
      this.vaccineForm.reset({
        name: '',
        status: 'pendente',
        dateTaken: null,
        scheduledDate: null,
        nextDueDate: null,
        notes: '',
      });
    }

    if (modal === 'deworming') {
      this.dewormingForm.reset({
        type: 'interna',
        dateDone: null,
        nextDueDate: null,
        productName: '',
        notes: '',
      });
    }

    if (modal === 'appointment') {
      this.appointmentForm.reset({
        appointmentDate: null,
        reason: '',
        clinicName: '',
        veterinarianName: '',
        result: '',
        nextAppointmentDate: null,
        notes: '',
      });
    }

    this.activeModal = modal;
  }

  closeModal(): void {
    if (this.isSubmitting) {
      return;
    }

    this.activeModal = null;
  }

  private getBirthDateParts(birthDate: string | null): {
    day: string;
    month: string;
    year: string;
  } {
    if (!birthDate) {
      return {
        day: '',
        month: '',
        year: '',
      };
    }

    const [year, month, day] = birthDate.split('-');

    return {
      day: String(Number(day)),
      month: String(Number(month)),
      year,
    };
  }

  private getBirthDate(): string {
    const day = String(this.form.value.birthDay).padStart(2, '0');
    const month = String(this.form.value.birthMonth).padStart(2, '0');
    const year = this.form.value.birthYear;

    return `${year}-${month}-${day}`;
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const hasMicrochip = !!this.form.value.hasMicrochip;

    try {
      this.isSubmitting = true;
      this.errorMessage = '';
      this.cdr.detectChanges();

      await this.animalService.updateAnimal(this.animalId, {
        name: this.form.value.name,
        speciesName: this.form.value.speciesName,
        breedName: this.form.value.breedName,
        gender: this.form.value.gender,
        birthDate: this.getBirthDate(),
        status: this.form.value.status,

        generalNotes: this.form.value.generalNotes || null,
        medicalNotes: this.form.value.medicalNotes || null,

        sterilizationStatus: this.form.value.sterilizationStatus || null,
        sterilizationDate: this.form.value.sterilizationDate || null,

        hasMicrochip,
        microchipNumber: hasMicrochip
          ? this.form.value.microchipNumber || null
          : null,
        microchipDate: hasMicrochip
          ? this.form.value.microchipDate || null
          : null,
      });

      const updatedAnimal =
        await this.animalService.getAnimalFromCurrentOrganization(this.animalId);

      this.animal = updatedAnimal;
      this.patchAnimalForm(updatedAnimal);
      this.activeModal = null;
    } catch (error: any) {
      console.error('Erro ao atualizar animal:', error);

      this.errorMessage =
        error?.message ||
        error?.details ||
        'Não foi possível atualizar o animal.';
    } finally {
      this.isSubmitting = false;
      this.cdr.detectChanges();
    }
  }

  async addVaccine(): Promise<void> {
    if (this.vaccineForm.invalid) {
      this.vaccineForm.markAllAsTouched();
      return;
    }

    try {
      this.isSubmitting = true;
      this.errorMessage = '';

      await this.vaccineService.create({
        animalId: this.animalId,
        name: this.vaccineForm.value.name,
        status: this.vaccineForm.value.status,
        dateTaken: this.vaccineForm.value.dateTaken || null,
        scheduledDate: this.vaccineForm.value.scheduledDate || null,
        nextDueDate: this.vaccineForm.value.nextDueDate || null,
        notes: this.vaccineForm.value.notes || null,
      });

      this.vaccines = await this.vaccineService.getByAnimalId(this.animalId);
      this.activeModal = null;
    } catch (error: any) {
      console.error('Erro ao adicionar vacina:', error);
      this.errorMessage =
        error?.message || 'Não foi possível adicionar a vacina.';
    } finally {
      this.isSubmitting = false;
      this.cdr.detectChanges();
    }
  }

  async deleteVaccine(vaccineId: string): Promise<void> {
    try {
      await this.vaccineService.delete(vaccineId);

      this.vaccines = this.vaccines.filter(
        vaccine => vaccine.id !== vaccineId
      );
    } catch (error: any) {
      console.error('Erro ao remover vacina:', error);
      this.errorMessage =
        error?.message || 'Não foi possível remover a vacina.';
    } finally {
      this.cdr.detectChanges();
    }
  }

  async addDeworming(): Promise<void> {
    if (this.dewormingForm.invalid) {
      this.dewormingForm.markAllAsTouched();
      return;
    }

    try {
      this.isSubmitting = true;
      this.errorMessage = '';

      await this.dewormingService.create({
        animalId: this.animalId,
        type: this.dewormingForm.value.type,
        dateDone: this.dewormingForm.value.dateDone,
        nextDueDate: this.dewormingForm.value.nextDueDate || null,
        productName: this.dewormingForm.value.productName || null,
        notes: this.dewormingForm.value.notes || null,
      });

      this.dewormingRecords =
        await this.dewormingService.getByAnimalId(this.animalId);

      this.activeModal = null;
    } catch (error: any) {
      console.error('Erro ao adicionar desparasitação:', error);
      this.errorMessage =
        error?.message || 'Não foi possível adicionar a desparasitação.';
    } finally {
      this.isSubmitting = false;
      this.cdr.detectChanges();
    }
  }

  async deleteDeworming(dewormingId: string): Promise<void> {
    try {
      await this.dewormingService.delete(dewormingId);

      this.dewormingRecords = this.dewormingRecords.filter(
        record => record.id !== dewormingId
      );
    } catch (error: any) {
      console.error('Erro ao remover desparasitação:', error);
      this.errorMessage =
        error?.message || 'Não foi possível remover a desparasitação.';
    } finally {
      this.cdr.detectChanges();
    }
  }

  async addVetAppointment(): Promise<void> {
    if (this.appointmentForm.invalid) {
      this.appointmentForm.markAllAsTouched();
      return;
    }

    try {
      this.isSubmitting = true;
      this.errorMessage = '';

      await this.vetAppointmentService.create({
        animalId: this.animalId,
        appointmentDate: this.appointmentForm.value.appointmentDate,
        reason: this.appointmentForm.value.reason,
        clinicName: this.appointmentForm.value.clinicName || null,
        veterinarianName: this.appointmentForm.value.veterinarianName || null,
        result: this.appointmentForm.value.result || null,
        nextAppointmentDate:
          this.appointmentForm.value.nextAppointmentDate || null,
        notes: this.appointmentForm.value.notes || null,
      });

      this.vetAppointments =
        await this.vetAppointmentService.getByAnimalId(this.animalId);

      this.activeModal = null;
    } catch (error: any) {
      console.error('Erro ao adicionar consulta veterinária:', error);
      this.errorMessage =
        error?.message || 'Não foi possível adicionar a consulta veterinária.';
    } finally {
      this.isSubmitting = false;
      this.cdr.detectChanges();
    }
  }

  async deleteVetAppointment(appointmentId: string): Promise<void> {
    try {
      await this.vetAppointmentService.delete(appointmentId);

      this.vetAppointments = this.vetAppointments.filter(
        appointment => appointment.id !== appointmentId
      );
    } catch (error: any) {
      console.error('Erro ao remover consulta veterinária:', error);
      this.errorMessage =
        error?.message || 'Não foi possível remover a consulta veterinária.';
    } finally {
      this.cdr.detectChanges();
    }
  }

  getGenderLabel(gender: string | null): string {
    const labels: Record<string, string> = {
      male: 'Macho',
      female: 'Fêmea',
    };

    return gender ? labels[gender] ?? gender : '—';
  }

  getStatusLabel(status: string | null): string {
    const labels: Record<string, string> = {
      por_adotar: 'Por adotar',
      em_tratamento: 'Em tratamento',
      adotado: 'Adotado',
      reservado: 'Reservado',
      acolhimento: 'Em acolhimento',
      indisponivel: 'Indisponível',
    };

    return status ? labels[status] ?? status : '—';
  }

  getSterilizationStatusLabel(status: string | null): string {
    const labels: Record<string, string> = {
      nao_realizada: 'Não realizada',
      realizada: 'Realizada',
      agendada: 'Agendada',
      nao_aplicavel: 'Não aplicável',
      desconhecido: 'Desconhecido',
    };

    return status ? labels[status] ?? status : 'Não definido';
  }

  getVaccineStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pendente: 'Pendente',
      tomada: 'Tomada',
    };

    return labels[status] ?? status;
  }

  getDewormingTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      interna: 'Interna',
      externa: 'Externa',
    };

    return labels[type] ?? type;
  }
}