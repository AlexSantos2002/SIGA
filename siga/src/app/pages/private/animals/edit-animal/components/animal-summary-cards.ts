import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import {
  ANIMAL_GENDER_LABELS,
  ANIMAL_STATUS_LABELS,
  STERILIZATION_STATUS_LABELS,
  getMappedLabel,
} from '../../../../../constants/form-options';
import { Adoption } from '../../../../../models/adoption/adoption.model';
import { Animal } from '../../../../../models/animal/animal.model';
import { EditAnimalModal } from '../edit-animal.types';

@Component({
  selector: 'app-animal-summary-cards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './animal-summary-cards.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnimalSummaryCards {
  @Input() animal!: Animal;
  @Input() acceptedAdoption: Adoption | null = null;

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

  getAdopterLabel(): string {
    const adopter = this.acceptedAdoption?.adopter;

    if (!adopter) {
      return '-';
    }

    return adopter.email ? `${adopter.name} - ${adopter.email}` : adopter.name;
  }
}
