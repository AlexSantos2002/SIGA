import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { DatePicker } from '../../../../components/date-picker/date-picker';
import {
  ADOPTER_DOCUMENT_TYPES,
  ADOPTER_EMPLOYMENT_STATUSES,
  ADOPTER_HOUSING_TYPES,
  ADOPTER_PREFERRED_SPECIES,
} from '../../../../constants/form-options';

@Component({
  selector: 'app-adopter-form',
  standalone: true,
  imports: [CommonModule, DatePicker, ReactiveFormsModule, RouterModule],
  templateUrl: './adopter-form.html',
  styleUrl: '../adopter-form.css',
})
export class AdopterForm {
  @Input() form!: FormGroup;
  @Input() isSubmitting = false;
  @Input() submitLabel = 'Guardar adotante';
  @Input() submittingLabel = 'A guardar...';

  @Output() formSubmit = new EventEmitter<void>();

  readonly documentTypes = ADOPTER_DOCUMENT_TYPES;
  readonly housingTypes = ADOPTER_HOUSING_TYPES;
  readonly employmentStatuses = ADOPTER_EMPLOYMENT_STATUSES;
  readonly preferredSpecies = ADOPTER_PREFERRED_SPECIES;

  submit(): void {
    this.formSubmit.emit();
  }
}
