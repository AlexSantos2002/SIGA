import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import {
  ANIMAL_GENDERS,
  ANIMAL_STATUSES,
  DAYS,
  DEWORMING_TYPES,
  MONTHS,
  STERILIZATION_STATUSES,
  VACCINE_STATUSES,
  createYearOptions,
} from '../../../../../constants/form-options';
import { Adopter } from '../../../../../models/adopter/adopter.model';
import { EditAnimalModal } from '../edit-animal.types';

@Component({
  selector: 'app-animal-edit-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './animal-edit-modal.html',
})
export class AnimalEditModal {
  @Input() activeModal!: EditAnimalModal;
  @Input() form!: FormGroup;
  @Input() vaccineForm!: FormGroup;
  @Input() dewormingForm!: FormGroup;
  @Input() appointmentForm!: FormGroup;
  @Input() adopters: Adopter[] = [];
  @Input() isSubmitting = false;

  @Output() close = new EventEmitter<void>();
  @Output() submitAnimal = new EventEmitter<void>();
  @Output() submitVaccine = new EventEmitter<void>();
  @Output() submitDeworming = new EventEmitter<void>();
  @Output() submitAppointment = new EventEmitter<void>();

  readonly statuses = ANIMAL_STATUSES;
  readonly genders = ANIMAL_GENDERS;
  readonly sterilizationStatuses = STERILIZATION_STATUSES;
  readonly vaccineStatuses = VACCINE_STATUSES;
  readonly dewormingTypes = DEWORMING_TYPES;
  readonly days = DAYS;
  readonly months = MONTHS;
  readonly years = createYearOptions();

  isAdoptedStatus(): boolean {
    return this.form?.get('status')?.value === 'adotado';
  }

  getAdopterLabel(adopter: Adopter): string {
    return `${adopter.name} ${adopter.lastName} - ${adopter.email}`;
  }
}
