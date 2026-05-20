import { Injectable } from '@angular/core';

import { supabase } from '../../../../supabase/supabase';
import { AnimalVetAppointment } from '../../models/animal/animal-vet-appointment.model';
import { RegisterAnimalVetAppointmentRequest } from '../../models/animal/register-animal-vet-appointment-request';

@Injectable({
  providedIn: 'root',
})
export class AnimalVetAppointmentService {
  private async withTimeout<T>(
    promise: PromiseLike<T>,
    timeoutMs = 10000
  ): Promise<T> {
    return Promise.race([
      Promise.resolve(promise),
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error('Tempo limite ao contactar a Supabase.')),
          timeoutMs
        )
      ),
    ]);
  }

  private async getCurrentOrganizationId(): Promise<string | null> {
    const {
      data: { user },
      error: userError,
    } = await this.withTimeout<any>(supabase.auth.getUser());

    if (userError || !user) {
      return null;
    }

    const { data, error } = await this.withTimeout<any>(
      supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single()
    );

    if (error || !data) {
      console.error('Erro ao obter organização:', error?.message);
      return null;
    }

    return data.organization_id;
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
  async getByAnimalId(animalId: string): Promise<AnimalVetAppointment[]> {
    const organizationId = await this.getCurrentOrganizationId();

    if (!organizationId) {
      return [];
    }

    const { data, error } = await this.withTimeout<any>(
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
        .order('appointment_date', { ascending: false })
    );

    if (error) {
      console.error('Erro ao carregar consultas:', error.message);
      return [];
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
    const organizationId = await this.getCurrentOrganizationId();

    if (!organizationId) {
      throw new Error('Organização não encontrada.');
    }

    const { error } = await this.withTimeout<any>(
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
      console.error('Erro ao criar consulta veterinária:', error.message);
      throw error;
    }
  }

  /**
   * @description
   * Remove uma consulta veterinária.
   */
  async delete(appointmentId: string): Promise<void> {
    const organizationId = await this.getCurrentOrganizationId();

    if (!organizationId) {
      throw new Error('Organização não encontrada.');
    }

    const { error } = await this.withTimeout<any>(
      supabase
        .from('animal_vet_appointments')
        .delete()
        .eq('id', appointmentId)
        .eq('organization_id', organizationId)
    );

    if (error) {
      console.error('Erro ao eliminar consulta veterinária:', error.message);
      throw error;
    }
  }
}