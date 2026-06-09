import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { AnimalVetAppointment } from '../../../../../models/animal/animal-vet-appointment.model';

@Component({
  selector: 'app-animal-vet-appointments-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './animal-vet-appointments-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnimalVetAppointmentsSection {
  @Input() appointments: AnimalVetAppointment[] = [];

  @Output() addAppointment = new EventEmitter<void>();
  @Output() removeAppointment = new EventEmitter<string>();

  trackByAppointmentId(_index: number, appointment: AnimalVetAppointment): string {
    return appointment.id;
  }
}
