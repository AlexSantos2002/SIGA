import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { DatePicker } from '../../../../components/date-picker/date-picker';
import {
  ADOPTER_DOCUMENT_TYPES,
  ADOPTER_EMPLOYMENT_STATUSES,
  ADOPTER_HOUSING_TYPES,
  ADOPTER_PREFERRED_SPECIES,
} from '../../../../constants/form-options';

@Component({
  selector: 'app-adoption-adopter-fields',
  standalone: true,
  imports: [CommonModule, DatePicker, ReactiveFormsModule],
  templateUrl: './adoption-adopter-fields.html',
})
export class AdoptionAdopterFields {
  @Input() form!: FormGroup;

  readonly documentTypes = ADOPTER_DOCUMENT_TYPES;
  readonly housingTypes = ADOPTER_HOUSING_TYPES;
  readonly employmentStatuses = ADOPTER_EMPLOYMENT_STATUSES;
  readonly preferredSpecies = ADOPTER_PREFERRED_SPECIES;
}
