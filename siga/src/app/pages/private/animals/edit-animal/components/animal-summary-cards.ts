import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import {
  ANIMAL_GENDER_LABELS,
  ANIMAL_STATUS_LABELS,
  STERILIZATION_STATUS_LABELS,
  getMappedLabel,
} from '../../../../../constants/form-options';
import { Animal } from '../../../../../models/animal/animal.model';
import { EditAnimalModal } from '../edit-animal.types';

@Component({
  selector: 'app-animal-summary-cards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './animal-summary-cards.html',
})
export class AnimalSummaryCards {
  @Input() animal!: Animal;

  @Output() editSection = new EventEmitter<EditAnimalModal>();

  getGenderLabel(gender: string | null): string {
    return getMappedLabel(ANIMAL_GENDER_LABELS, gender);
  }

  getStatusLabel(status: string | null): string {
    return getMappedLabel(ANIMAL_STATUS_LABELS, status);
  }

  getSterilizationStatusLabel(status: string | null): string {
    return getMappedLabel(STERILIZATION_STATUS_LABELS, status, 'Nao definido');
  }
}
