import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { Adoption } from '../../../../models/adoption/adoption.model';
import { Animal } from '../../../../models/animal/animal.model';
import { AnimalDeworming } from '../../../../models/animal/animal-deworming.model';
import { AnimalVetAppointment } from '../../../../models/animal/animal-vet-appointment.model';
import { AnimalVaccine } from '../../../../models/vaccines/animal-vaccines.model';
import { AdoptionService } from '../../../../services/adoption/adoption.service';
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
import { ImageService } from '../../../../services/image.service';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditAnimal implements OnInit, OnDestroy {
  @ViewChild('imageInput') imageInput?: ElementRef<HTMLInputElement>;

  animal: Animal | null = null;
  animalId = '';
  acceptedAdoption: Adoption | null = null;
  animalImage: string | null = null;
  selectedImageFile: File | null = null;

  form: FormGroup;
  vaccineForm: FormGroup;
  dewormingForm: FormGroup;
  appointmentForm: FormGroup;

  vaccines: AnimalVaccine[] = [];
  dewormingRecords: AnimalDeworming[] = [];
  vetAppointments: AnimalVetAppointment[] = [];

  isLoading = true;
  isSubmitting = false;
  isImageSubmitting = false;
  errorMessage = '';

  activeModal: EditAnimalModal = null;

  private readonly formSubscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private animalService: AnimalService,
    private adoptionService: AdoptionService,
    private vaccineService: AnimalVaccineService,
    private dewormingService: AnimalDewormingService,
    private vetAppointmentService: AnimalVetAppointmentService,
    private imageService: ImageService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(80)]],
      speciesName: ['', [Validators.required, Validators.maxLength(60)]],
      breedName: ['', [Validators.required, Validators.maxLength(80)]],
      gender: ['', Validators.required],
      birthDate: [null, Validators.required],
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

    this.setupFormSubscriptions();
    this.updateHealthValidators(false);
    this.updateVaccineValidators();
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
    this.formSubscriptions.unsubscribe();
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
      this.updateVaccineValidators();
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

    if (modal === 'health') {
      this.updateHealthValidators(false);
    }

    this.activeModal = modal;
  }

  closeModal(): void {
    if (this.isSubmitting) {
      return;
    }

    this.activeModal = null;
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.errorMessage = '';
    this.selectedImageFile = input.files?.[0] ?? null;
  }

  openImagePicker(): void {
    if (this.isImageSubmitting) {
      return;
    }

    this.imageInput?.nativeElement.click();
  }

  clearSelectedImage(): void {
    this.selectedImageFile = null;

    if (this.imageInput) {
      this.imageInput.nativeElement.value = '';
    }
  }

  async saveSelectedImage(): Promise<void> {
    if (!this.animal || !this.selectedImageFile) {
      return;
    }

    try {
      this.isImageSubmitting = true;
      this.errorMessage = '';
      this.cdr.detectChanges();

      if (this.animal.imagePath) {
        await this.imageService.replaceImage(
          this.animal.id,
          this.animal.imagePath,
          this.selectedImageFile,
        );
      } else {
        await this.imageService.uploadImage(this.animal.id, this.selectedImageFile);
      }

      await this.reloadAnimal();
      this.clearSelectedImage();
    } catch (error: any) {
      console.error('Erro ao guardar imagem do animal:', error);
      this.errorMessage = error?.message || error?.details || 'Nao foi possivel guardar a imagem.';
    } finally {
      this.isImageSubmitting = false;
      this.cdr.detectChanges();
    }
  }

  async removeImage(): Promise<void> {
    if (!this.animal?.imagePath) {
      return;
    }

    try {
      this.isImageSubmitting = true;
      this.errorMessage = '';
      this.cdr.detectChanges();

      await this.imageService.deleteImage(this.animal.id, this.animal.imagePath);
      await this.reloadAnimal();
      this.clearSelectedImage();
    } catch (error: any) {
      console.error('Erro ao remover imagem do animal:', error);
      this.errorMessage = error?.message || error?.details || 'Nao foi possivel remover a imagem.';
    } finally {
      this.isImageSubmitting = false;
      this.cdr.detectChanges();
    }
  }

  async submit(): Promise<void> {
    this.updateHealthValidators(false);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();
    const hasMicrochip = !!formValue.hasMicrochip;
    const selectedStatus = formValue.status;

    try {
      this.isSubmitting = true;
      this.errorMessage = '';
      this.cdr.detectChanges();

      await this.animalService.updateAnimal(this.animalId, {
        name: formValue.name,
        speciesName: formValue.speciesName,
        breedName: formValue.breedName,
        gender: formValue.gender,
        birthDate: this.getBirthDate(),
        status: selectedStatus,
        generalNotes: formValue.generalNotes || null,
        medicalNotes: formValue.medicalNotes || null,
        sterilizationStatus: formValue.sterilizationStatus || null,
        sterilizationDate: formValue.sterilizationDate || null,
        hasMicrochip,
        microchipNumber: hasMicrochip ? formValue.microchipNumber || null : null,
        microchipDate: hasMicrochip ? formValue.microchipDate || null : null,
      });

      const [updatedAnimal, updatedAcceptedAdoption] = await Promise.all([
        this.animalService.getAnimalFromCurrentOrganization(this.animalId),
        this.adoptionService.getAcceptedByAnimalId(this.animalId),
      ]);

      this.animal = updatedAnimal;
      this.acceptedAdoption = updatedAnimal.status === 'adotado' ? updatedAcceptedAdoption : null;
      this.animalImage = this.imageService.getAnimalImage(updatedAnimal.imagePath);
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
    this.updateVaccineValidators();

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

      const [animal, vaccines, dewormingRecords, vetAppointments, acceptedAdoption] =
        await Promise.all([
          this.animalService.getAnimalFromCurrentOrganization(this.animalId),
          this.vaccineService.getByAnimalId(this.animalId),
          this.dewormingService.getByAnimalId(this.animalId),
          this.vetAppointmentService.getByAnimalId(this.animalId),
          this.adoptionService.getAcceptedByAnimalId(this.animalId),
        ]);

      this.animal = animal;
      this.animalImage = this.imageService.getAnimalImage(animal.imagePath);
      this.vaccines = vaccines;
      this.dewormingRecords = dewormingRecords;
      this.vetAppointments = vetAppointments;
      this.acceptedAdoption = animal.status === 'adotado' ? acceptedAdoption : null;

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
    this.form.patchValue(
      {
        name: animal.name,
        speciesName: animal.species?.name || '',
        breedName: animal.breed?.name || '',
        gender: animal.gender || '',
        birthDate: animal.birthDate || null,
        status: animal.status || 'por_adotar',
        generalNotes: animal.generalNotes || '',
        medicalNotes: animal.medicalNotes || '',
        sterilizationStatus: animal.sterilizationStatus || '',
        sterilizationDate: animal.sterilizationDate || null,
        hasMicrochip: animal.hasMicrochip || false,
        microchipNumber: animal.microchipNumber || '',
        microchipDate: animal.microchipDate || null,
      },
      { emitEvent: false },
    );
    this.updateHealthValidators(false);
  }

  private getBirthDate(): string {
    return this.form.getRawValue().birthDate;
  }

  private async reloadAnimal(): Promise<void> {
    const animal = await this.animalService.getAnimalFromCurrentOrganization(this.animalId);

    this.animal = animal;
    this.animalImage = this.imageService.getAnimalImage(animal.imagePath);
    this.patchAnimalForm(animal);
  }

  private setupFormSubscriptions(): void {
    const hasMicrochipChanges = this.form
      .get('hasMicrochip')
      ?.valueChanges.subscribe(() => this.updateHealthValidators(true));
    const sterilizationStatusChanges = this.form
      .get('sterilizationStatus')
      ?.valueChanges.subscribe(() => this.updateHealthValidators(false));
    const vaccineStatusChanges = this.vaccineForm
      .get('status')
      ?.valueChanges.subscribe(() => this.updateVaccineValidators());

    if (hasMicrochipChanges) {
      this.formSubscriptions.add(hasMicrochipChanges);
    }

    if (sterilizationStatusChanges) {
      this.formSubscriptions.add(sterilizationStatusChanges);
    }

    if (vaccineStatusChanges) {
      this.formSubscriptions.add(vaccineStatusChanges);
    }
  }

  private updateHealthValidators(clearMicrochipWhenDisabled: boolean): void {
    const hasMicrochip = !!this.form.get('hasMicrochip')?.value;
    const microchipNumber = this.form.get('microchipNumber');
    const microchipDate = this.form.get('microchipDate');
    const sterilizationDate = this.form.get('sterilizationDate');
    const sterilizationStatus = this.form.get('sterilizationStatus')?.value;

    if (hasMicrochip) {
      microchipNumber?.enable({ emitEvent: false });
      microchipDate?.enable({ emitEvent: false });
      microchipNumber?.setValidators([Validators.required, Validators.maxLength(60)]);
      microchipDate?.setValidators([Validators.required]);
    } else {
      if (clearMicrochipWhenDisabled) {
        microchipNumber?.reset('', { emitEvent: false });
        microchipDate?.reset(null, { emitEvent: false });
      }

      microchipNumber?.clearValidators();
      microchipDate?.clearValidators();
      microchipNumber?.disable({ emitEvent: false });
      microchipDate?.disable({ emitEvent: false });
    }

    if (sterilizationStatus === 'realizada') {
      sterilizationDate?.setValidators([Validators.required]);
    } else {
      sterilizationDate?.clearValidators();
    }

    microchipNumber?.updateValueAndValidity({ emitEvent: false });
    microchipDate?.updateValueAndValidity({ emitEvent: false });
    sterilizationDate?.updateValueAndValidity({ emitEvent: false });
  }

  private updateVaccineValidators(): void {
    const dateTaken = this.vaccineForm.get('dateTaken');
    const scheduledDate = this.vaccineForm.get('scheduledDate');
    const status = this.vaccineForm.get('status')?.value;

    dateTaken?.clearValidators();
    scheduledDate?.clearValidators();

    if (status === 'tomada') {
      dateTaken?.setValidators([Validators.required]);
    } else {
      scheduledDate?.setValidators([Validators.required]);
    }

    dateTaken?.updateValueAndValidity({ emitEvent: false });
    scheduledDate?.updateValueAndValidity({ emitEvent: false });
  }
}
