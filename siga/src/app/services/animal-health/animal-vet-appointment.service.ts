import { Injectable } from '@angular/core';

import { supabase } from '../../../../supabase/supabase';
import { AnimalVetAppointment } from '../../models/animal/animal-vet-appointment.model';
import { RegisterAnimalVetAppointmentRequest } from '../../models/animal/register-animal-vet-appointment-request';
import { withTimeout } from '../../utils/utils';
import { AuthService } from '../auth/auth.service';
import { AuthenticationError, DBError } from '../../error/app-error';
import { ERROR_CODES } from '../../error/error-codes';

@Injectable({
  providedIn: 'root',
})
export class AnimalVetAppointmentService {

  constructor(private authService: AuthService) {
  }

  private mapAppointment(appointment: any): AnimalVetAppointment {
    return {
      id: appointment.id,
      animalId: appointment.animal_id,
      organizationId: appointment.organization_id,
      appointmentDate: appointment.appointment_date,
      reason: appointment.reason,
      clinicName: appointment.clinic_name,
      veterinarianName: appointment.veterinarian_name,
      result: appointment.result,
      nextAppointmentDate: appointment.next_appointment_date,
      notes: appointment.notes,
      createdAt: appointment.created_at,
    };
  }

  /**
   * @description
   * Obtém as consultas veterinárias associadas a um animal.
   */
  async getByAnimalId(animalId: string, timeoutMs = 10000): Promise<AnimalVetAppointment[]> {
    const organizationId = this.authService.getCurrentOrganizationId();

    if (!organizationId) {
      throw new AuthenticationError(ERROR_CODES.NOT_AUTHENTICATED);
    }

    const { data, error } = await withTimeout<any>(
      supabase
        .from('animal_vet_appointments')
        .select(`
          id,
          animal_id,
          organization_id,
          appointment_date,
          reason,
          clinic_name,
          veterinarian_name,
          result,
          next_appointment_date,
          notes,
          created_at
        `)
        .eq('animal_id', animalId)
        .eq('organization_id', organizationId)
        .order('appointment_date', { ascending: false }),
      timeoutMs,
    );

    if (error) {
      throw new DBError(ERROR_CODES.UNABLE_TO_GET_VET_APPT);
    }

    return (data ?? []).map((appointment: any) =>
      this.mapAppointment(appointment)
    );
  }

  /**
   * @description
   * Cria uma consulta veterinária associada a um animal.
   */
  async create(request: RegisterAnimalVetAppointmentRequest): Promise<void> {
    const organizationId = this.authService.getCurrentOrganizationId();

    if (!organizationId) {
      throw new Error('Organização não encontrada.');
    }

    const { error } = await withTimeout<any>(
      supabase.from('animal_vet_appointments').insert({
        animal_id: request.animalId,
        organization_id: organizationId,
        appointment_date: request.appointmentDate,
        reason: request.reason.trim(),
        clinic_name: request.clinicName || null,
        veterinarian_name: request.veterinarianName || null,
        result: request.result || null,
        next_appointment_date: request.nextAppointmentDate || null,
        notes: request.notes || null,
      })
    );

    if (error) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }
  }

  /**
   * @description
   * Confirma que uma consulta ou tratamento agendado foi realizado.
   */
  async confirmCompleted(appointmentId: string): Promise<void> {
    const organizationId = this.authService.getCurrentOrganizationId();

    if (!organizationId) {
      throw new AuthenticationError(ERROR_CODES.NOT_AUTHENTICATED);
    }

    const { error } = await withTimeout<any>(
      supabase
        .from('animal_vet_appointments')
        .update({
          result: 'Realizada',
        })
        .eq('id', appointmentId)
        .eq('organization_id', organizationId)
    );

    if (error) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }
  }

  /**
   * @description
   * Remove uma consulta veterinária.
   */
  async delete(appointmentId: string): Promise<void> {
    const organizationId = this.authService.getCurrentOrganizationId();

    if (!organizationId) {
      throw new Error('Organização não encontrada.');
    }

    const { error } = await withTimeout<any>(
      supabase
        .from('animal_vet_appointments')
        .delete()
        .eq('id', appointmentId)
        .eq('organization_id', organizationId)
    );

    if (error) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }
  }
}
