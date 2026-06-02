import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { VACCINE_STATUSES, getOptionLabel } from '../../../../../constants/form-options';
import { AnimalVaccine } from '../../../../../models/vaccines/animal-vaccines.model';

@Component({
  selector: 'app-animal-vaccines-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './animal-vaccines-section.html',
})
export class AnimalVaccinesSection {
  @Input() vaccines: AnimalVaccine[] = [];

  @Output() addVaccine = new EventEmitter<void>();
  @Output() removeVaccine = new EventEmitter<string>();

  getVaccineStatusLabel(status: string): string {
    return getOptionLabel(VACCINE_STATUSES, status);
  }
}
