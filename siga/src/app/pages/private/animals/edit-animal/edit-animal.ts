import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { Adoption } from '../../../../models/adoption/adoption.model';
import { Adopter } from '../../../../models/adopter/adopter.model';
import { Animal } from '../../../../models/animal/animal.model';
import { AnimalDeworming } from '../../../../models/animal/animal-deworming.model';
import { AnimalVetAppointment } from '../../../../models/animal/animal-vet-appointment.model';
import { AnimalVaccine } from '../../../../models/vaccines/animal-vaccines.model';
import { AdoptionService } from '../../../../services/adoption/adoption.service';
import { AdoptersService } from '../../../../services/adopter/adopters.service';
import { AnimalService } from '../../../../services/animal/animal.service';
import { AnimalDewormingService } from '../../../../services/animal-health/animal-deworming.service';
import { AnimalVaccineService } from '../../../../services/animal-health/animal-vaccine.service';
import { AnimalVetAppointmentService } from '../../../../services/animal-health/animal-vet-appointment.service';
import { AnimalDewormingSection } from './components/animal-deworming-section';
import { AnimalEditModal } from './components/animal-edit-modal';
import { AnimalSummaryCards } from './components/animal-summary-cards';
import { AnimalVaccinesSection } from './components/animal-vaccines-section';
import { AnimalVetAppointmentsSection } from './components/animal-vet-appointments-section';
import { EditAnimalModal } from './edit-animal.types';

@Component({
  selector: 'app-edit-animal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    AnimalSummaryCards,
    AnimalVaccinesSection,
    AnimalDewormingSection,
    AnimalVetAppointmentsSection,
    AnimalEditModal,
  ],
  templateUrl: './edit-animal.html',
  styleUrl: './edit-animal.css',
})
export class EditAnimal implements OnInit, OnDestroy {
  animal: Animal | null = null;
  animalId = '';
  acceptedAdoption: Adoption | null = null;

  form: FormGroup;
  vaccineForm: FormGroup;
  dewormingForm: FormGroup;
  appointmentForm: FormGroup;

  vaccines: AnimalVaccine[] = [];
  dewormingRecords: AnimalDeworming[] = [];
  vetAppointments: AnimalVetAppointment[] = [];
  adopters: Adopter[] = [];

  isLoading = true;
  isSubmitting = false;
  errorMessage = '';

  activeModal: EditAnimalModal = null;
  private statusSubscription: Subscription | null = null;

  constructor(
    private fb: FormBuilder,
    private animalService: AnimalService,
    private adoptionService: AdoptionService,
    private adoptersService: AdoptersService,
    private vaccineService: AnimalVaccineService,
    private dewormingService: AnimalDewormingService,
    private vetAppointmentService: AnimalVetAppointmentService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(80)]],
      speciesName: ['', [Validators.required, Validators.maxLength(60)]],
      breedName: ['', [Validators.required, Validators.maxLength(80)]],
      gender: ['', Validators.required],
      birthDay: ['', Validators.required],
      birthMonth: ['', Validators.required],
      birthYear: ['', Validators.required],
      status: ['por_adotar', Validators.required],
      adopterId: [''],
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

    this.statusSubscription = this.form.get('status')?.valueChanges.subscribe((status) => {
      this.updateAdopterValidators(status);
    }) ?? null;
  }

  async ngOnInit(): Promise<void> {
    this.animalId = this.route.snapshot.paramMap.get('id') || '';

    if (!this.animalId) {
      this.errorMessage = 'Animal nao encontrado.';
      this.isLoading = false;
      return;
    }

    await this.loadPageData();
  }

  ngOnDestroy(): void {
    this.statusSubscription?.unsubscribe();
  }

  openModal(modal: EditAnimalModal): void {
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

  async submit(): Promise<void> {
    this.updateAdopterValidators(this.form.value.status);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const hasMicrochip = !!this.form.value.hasMicrochip;
    const selectedStatus = this.form.value.status;
    const selectedAdopterId = this.form.value.adopterId || '';

    try {
      this.isSubmitting = true;
      this.errorMessage = '';
      this.cdr.detectChanges();

      if (selectedStatus === 'adotado') {
        this.acceptedAdoption = await this.adoptionService.linkAcceptedAdoptionToAnimal(
          this.animalId,
          selectedAdopterId,
        );
      }

      await this.animalService.updateAnimal(this.animalId, {
        name: this.form.value.name,
        speciesName: this.form.value.speciesName,
        breedName: this.form.value.breedName,
        gender: this.form.value.gender,
        birthDate: this.getBirthDate(),
        status: selectedStatus,
        generalNotes: this.form.value.generalNotes || null,
        medicalNotes: this.form.value.medicalNotes || null,
        sterilizationStatus: this.form.value.sterilizationStatus || null,
        sterilizationDate: this.form.value.sterilizationDate || null,
        hasMicrochip,
        microchipNumber: hasMicrochip ? this.form.value.microchipNumber || null : null,
        microchipDate: hasMicrochip ? this.form.value.microchipDate || null : null,
      });

      const [updatedAnimal, updatedAcceptedAdoption] = await Promise.all([
        this.animalService.getAnimalFromCurrentOrganization(this.animalId),
        this.adoptionService.getAcceptedByAnimalId(this.animalId),
      ]);

      this.animal = updatedAnimal;
      this.acceptedAdoption = updatedAnimal.status === 'adotado'
        ? updatedAcceptedAdoption
        : null;
      this.patchAnimalForm(updatedAnimal);
      this.activeModal = null;
    } catch (error: any) {
      console.error('Erro ao atualizar animal:', error);
      this.errorMessage =
        error?.message || error?.details || 'Nao foi possivel atualizar o animal.';
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
      this.errorMessage = error?.message || 'Nao foi possivel adicionar a vacina.';
    } finally {
      this.isSubmitting = false;
      this.cdr.detectChanges();
    }
  }

  async deleteVaccine(vaccineId: string): Promise<void> {
    try {
      await this.vaccineService.delete(vaccineId);
      this.vaccines = this.vaccines.filter((vaccine) => vaccine.id !== vaccineId);
    } catch (error: any) {
      console.error('Erro ao remover vacina:', error);
      this.errorMessage = error?.message || 'Nao foi possivel remover a vacina.';
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

      this.dewormingRecords = await this.dewormingService.getByAnimalId(this.animalId);
      this.activeModal = null;
    } catch (error: any) {
      console.error('Erro ao adicionar desparasitacao:', error);
      this.errorMessage = error?.message || 'Nao foi possivel adicionar a desparasitacao.';
    } finally {
      this.isSubmitting = false;
      this.cdr.detectChanges();
    }
  }

  async deleteDeworming(dewormingId: string): Promise<void> {
    try {
      await this.dewormingService.delete(dewormingId);
      this.dewormingRecords = this.dewormingRecords.filter((record) => record.id !== dewormingId);
    } catch (error: any) {
      console.error('Erro ao remover desparasitacao:', error);
      this.errorMessage = error?.message || 'Nao foi possivel remover a desparasitacao.';
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
        nextAppointmentDate: this.appointmentForm.value.nextAppointmentDate || null,
        notes: this.appointmentForm.value.notes || null,
      });

      this.vetAppointments = await this.vetAppointmentService.getByAnimalId(this.animalId);
      this.activeModal = null;
    } catch (error: any) {
      console.error('Erro ao adicionar consulta veterinaria:', error);
      this.errorMessage = error?.message || 'Nao foi possivel adicionar a consulta veterinaria.';
    } finally {
      this.isSubmitting = false;
      this.cdr.detectChanges();
    }
  }

  async deleteVetAppointment(appointmentId: string): Promise<void> {
    try {
      await this.vetAppointmentService.delete(appointmentId);
      this.vetAppointments = this.vetAppointments.filter(
        (appointment) => appointment.id !== appointmentId,
      );
    } catch (error: any) {
      console.error('Erro ao remover consulta veterinaria:', error);
      this.errorMessage = error?.message || 'Nao foi possivel remover a consulta veterinaria.';
    } finally {
      this.cdr.detectChanges();
    }
  }

  private async loadPageData(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      this.cdr.detectChanges();

      const [
        animal,
        vaccines,
        dewormingRecords,
        vetAppointments,
        adopters,
        acceptedAdoption,
      ] = await Promise.all([
        this.animalService.getAnimalFromCurrentOrganization(this.animalId),
        this.vaccineService.getByAnimalId(this.animalId),
        this.dewormingService.getByAnimalId(this.animalId),
        this.vetAppointmentService.getByAnimalId(this.animalId),
        this.adoptersService.getAll(),
        this.adoptionService.getAcceptedByAnimalId(this.animalId),
      ]);

      this.animal = animal;
      this.vaccines = vaccines;
      this.dewormingRecords = dewormingRecords;
      this.vetAppointments = vetAppointments;
      this.adopters = adopters;
      this.acceptedAdoption = animal.status === 'adotado'
        ? acceptedAdoption
        : null;

      this.patchAnimalForm(animal);
    } catch (error: any) {
      console.error('Erro ao carregar ficha do animal:', error);
      this.errorMessage =
        error?.message || error?.details || 'Nao foi possivel carregar a ficha do animal.';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  private patchAnimalForm(animal: Animal): void {
    const birthDateParts = this.getBirthDateParts(animal.birthDate);
    const adopterId = animal.status === 'adotado'
      ? this.acceptedAdoption?.adopter?.id ?? ''
      : '';

    this.form.patchValue({
      name: animal.name,
      speciesName: animal.species?.name || '',
      breedName: animal.breed?.name || '',
      gender: animal.gender || '',
      birthDay: birthDateParts.day,
      birthMonth: birthDateParts.month,
      birthYear: birthDateParts.year,
      status: animal.status || 'por_adotar',
      adopterId,
      generalNotes: animal.generalNotes || '',
      medicalNotes: animal.medicalNotes || '',
      sterilizationStatus: animal.sterilizationStatus || '',
      sterilizationDate: animal.sterilizationDate || null,
      hasMicrochip: animal.hasMicrochip || false,
      microchipNumber: animal.microchipNumber || '',
      microchipDate: animal.microchipDate || null,
    });

    this.updateAdopterValidators(animal.status || 'por_adotar');
  }

  private updateAdopterValidators(status: string | null): void {
    const adopterControl = this.form.get('adopterId');

    if (!adopterControl) {
      return;
    }

    if (status === 'adotado') {
      adopterControl.setValidators([Validators.required]);
    } else {
      adopterControl.clearValidators();
      adopterControl.setValue('', { emitEvent: false });
    }

    adopterControl.updateValueAndValidity({ emitEvent: false });
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
}
