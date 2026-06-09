import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { DEWORMING_TYPES, getOptionLabel } from '../../../../../constants/form-options';
import { AnimalDeworming } from '../../../../../models/animal/animal-deworming.model';

@Component({
  selector: 'app-animal-deworming-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './animal-deworming-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnimalDewormingSection {
  @Input() records: AnimalDeworming[] = [];

  @Output() addDeworming = new EventEmitter<void>();
  @Output() removeDeworming = new EventEmitter<string>();

  getDewormingTypeLabel(type: string): string {
    return getOptionLabel(DEWORMING_TYPES, type);
  }

  trackByDewormingId(_index: number, record: AnimalDeworming): string {
    return record.id;
  }
}
