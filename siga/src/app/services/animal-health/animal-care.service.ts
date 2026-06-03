import { Injectable } from '@angular/core';

import { supabase } from '../../../../supabase/supabase';
import { AuthenticationError, DBError } from '../../error/app-error';
import { ERROR_CODES } from '../../error/error-codes';
import {
  AnimalCareAnimal,
  AnimalCareRecord,
} from '../../models/animal-health/animal-care-record.model';
import { withTimeout } from '../../utils/utils';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AnimalCareService {
  constructor(private authService: AuthService) {}

  async getAll(): Promise<AnimalCareRecord[]> {
    const organizationId = this.authService.getCurrentOrganizationId();

    if (!organizationId) {
      throw new AuthenticationError(ERROR_CODES.NOT_AUTHENTICATED);
    }

    const [vaccinesResult, dewormingResult, appointmentsResult] = await Promise.all([
      withTimeout<any>(
        supabase
          .from('animal_vaccines')
          .select(
            `
            id,
            animal_id,
            name,
            status,
            date_taken,
            scheduled_date,
            next_due_date,
            notes,
            created_at,
            animal:animal_id (
              id,
              name,
              status,
              species:species_id (
                name
              ),
              breed:breed_id (
                name
              )
            )
          `,
          )
          .eq('organization_id', organizationId),
      ),
      withTimeout<any>(
        supabase
          .from('animal_deworming')
          .select(
            `
            id,
            animal_id,
            type,
            date_done,
            next_due_date,
            product_name,
            notes,
            created_at,
            animal:animal_id (
              id,
              name,
              status,
              species:species_id (
                name
              ),
              breed:breed_id (
                name
              )
            )
          `,
          )
          .eq('organization_id', organizationId),
      ),
      withTimeout<any>(
        supabase
          .from('animal_vet_appointments')
          .select(
            `
            id,
            animal_id,
            appointment_date,
            reason,
            clinic_name,
            veterinarian_name,
            result,
            next_appointment_date,
            notes,
            created_at,
            animal:animal_id (
              id,
              name,
              status,
              species:species_id (
                name
              ),
              breed:breed_id (
                name
              )
            )
          `,
          )
          .eq('organization_id', organizationId),
      ),
    ]);

    if (vaccinesResult.error || dewormingResult.error || appointmentsResult.error) {
      throw new DBError(ERROR_CODES.UNABLE_TO_GET_CARE_RECORDS);
    }

    const records = [
      ...(vaccinesResult.data ?? []).map((vaccine: any) => this.mapVaccine(vaccine)),
      ...(dewormingResult.data ?? []).map((deworming: any) => this.mapDeworming(deworming)),
      ...(appointmentsResult.data ?? []).map((appointment: any) =>
        this.mapAppointment(appointment),
      ),
    ];

    return records.sort((firstRecord, secondRecord) =>
      secondRecord.createdAt.localeCompare(firstRecord.createdAt),
    );
  }

  private mapVaccine(vaccine: any): AnimalCareRecord {
    const wasTaken = vaccine.status === 'tomada';

    return {
      id: vaccine.id,
      animalId: vaccine.animal_id,
      animal: this.mapAnimal(vaccine.animal),
      type: 'vaccine',
      title: vaccine.name,
      detail: wasTaken ? 'Vacina tomada' : 'Vacina pendente',
      status: wasTaken ? 'completed' : 'pending',
      scheduledDate: vaccine.scheduled_date,
      completedDate: vaccine.date_taken,
      nextDueDate: vaccine.next_due_date,
      notes: vaccine.notes,
      createdAt: vaccine.created_at,
    };
  }

  private mapDeworming(deworming: any): AnimalCareRecord {
    const typeLabel = deworming.type === 'externa' ? 'externa' : 'interna';

    return {
      id: deworming.id,
      animalId: deworming.animal_id,
      animal: this.mapAnimal(deworming.animal),
      type: 'deworming',
      title: `Desparasitação ${typeLabel}`,
      detail: deworming.product_name,
      status: 'completed',
      scheduledDate: null,
      completedDate: deworming.date_done,
      nextDueDate: deworming.next_due_date,
      notes: deworming.notes,
      createdAt: deworming.created_at,
    };
  }

  private mapAppointment(appointment: any): AnimalCareRecord {
    const hasResult = !!appointment.result;

    return {
      id: appointment.id,
      animalId: appointment.animal_id,
      animal: this.mapAnimal(appointment.animal),
      type: 'appointment',
      title: appointment.reason,
      detail: this.getAppointmentDetail(appointment),
      status: hasResult ? 'completed' : 'pending',
      scheduledDate: hasResult ? null : appointment.appointment_date,
      completedDate: hasResult ? appointment.appointment_date : null,
      nextDueDate: appointment.next_appointment_date,
      notes: appointment.notes,
      createdAt: appointment.created_at,
    };
  }

  private mapAnimal(animal: any): AnimalCareAnimal {
    return {
      id: animal?.id ?? '',
      name: animal?.name ?? 'Animal sem nome',
      speciesName: animal?.species?.name ?? null,
      breedName: animal?.breed?.name ?? null,
      status: animal?.status ?? null,
    };
  }

  private getAppointmentDetail(appointment: any): string | null {
    const parts = [appointment.clinic_name, appointment.veterinarian_name, appointment.result]
      .map((value) => value?.trim())
      .filter(Boolean);

    return parts.length ? parts.join(' - ') : null;
  }
}
