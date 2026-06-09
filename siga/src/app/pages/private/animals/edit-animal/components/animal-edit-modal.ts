import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { DatePicker } from '../../../../../components/date-picker/date-picker';
import {
  ANIMAL_GENDERS,
  ANIMAL_STATUSES,
  DEWORMING_TYPES,
  STERILIZATION_STATUSES,
  VACCINE_STATUSES,
  SelectOption,
} from '../../../../../constants/form-options';
import { EditAnimalModal } from '../edit-animal.types';

@Component({
  selector: 'app-animal-edit-modal',
  standalone: true,
  imports: [CommonModule, DatePicker, ReactiveFormsModule],
  templateUrl: './animal-edit-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnimalEditModal {
  @Input() activeModal!: EditAnimalModal;
  @Input() form!: FormGroup;
  @Input() vaccineForm!: FormGroup;
  @Input() dewormingForm!: FormGroup;
  @Input() appointmentForm!: FormGroup;
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

  get statusOptions(): SelectOption[] {
    const currentStatus = this.form?.get('status')?.value;

    if (currentStatus === 'adotado') {
      return [{ value: 'adotado', label: 'Adotado' }, ...this.statuses];
    }

    return this.statuses;
  }
}
