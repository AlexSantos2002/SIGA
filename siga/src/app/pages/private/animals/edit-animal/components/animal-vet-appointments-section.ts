import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { AnimalVetAppointment } from '../../../../../models/animal/animal-vet-appointment.model';

@Component({
  selector: 'app-animal-vet-appointments-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './animal-vet-appointments-section.html',
})
export class AnimalVetAppointmentsSection {
  @Input() appointments: AnimalVetAppointment[] = [];

  @Output() addAppointment = new EventEmitter<void>();
  @Output() removeAppointment = new EventEmitter<string>();
}
