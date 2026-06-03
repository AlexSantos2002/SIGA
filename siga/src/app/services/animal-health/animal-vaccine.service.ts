import { Injectable } from '@angular/core';

import { supabase } from '../../../../supabase/supabase';
import { AnimalVaccine } from '../../models/vaccines/animal-vaccines.model';
import { RegisterAnimalVaccineRequest } from '../../models/vaccines/register-animal-vaccine-request';
import { withTimeout } from '../../utils/utils';
import { AuthService } from '../auth/auth.service';
import { AuthenticationError, DBError } from '../../error/app-error';
import { ERROR_CODES } from '../../error/error-codes';

@Injectable({
  providedIn: 'root',
})
export class AnimalVaccineService {
  constructor(private authService: AuthService) {}

  private mapVaccine(vaccine: any): AnimalVaccine {
    return {
      id: vaccine.id,
      animalId: vaccine.animal_id,
      organizationId: vaccine.organization_id,
      name: vaccine.name,
      status: vaccine.status,
      dateTaken: vaccine.date_taken,
      scheduledDate: vaccine.scheduled_date,
      nextDueDate: vaccine.next_due_date,
      notes: vaccine.notes,
      createdAt: vaccine.created_at,
    };
  }

  /**
   * @description
   * Obtém as vacinas associadas a um animal.
   */
  async getByAnimalId(animalId: string): Promise<AnimalVaccine[]> {
    const organizationId = this.authService.getCurrentOrganizationId();

    if (!organizationId) {
      throw new AuthenticationError(ERROR_CODES.NOT_AUTHENTICATED);
    }

    const { data, error } = await withTimeout<any>(
      supabase
        .from('animal_vaccines')
        .select(
          `
          id,
          animal_id,
          organization_id,
          name,
          status,
          date_taken,
          scheduled_date,
          next_due_date,
          notes,
          created_at
        `,
        )
        .eq('animal_id', animalId)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false }),
    );

    if (error) {
      throw new DBError(ERROR_CODES.UNABLE_TO_GET_VACCINE);
    }

    return (data ?? []).map((vaccine: any) => this.mapVaccine(vaccine));
  }

  /**
   * @description
   * Cria uma vacina associada a um animal.
   */
  async create(request: RegisterAnimalVaccineRequest): Promise<void> {
    const organizationId = this.authService.getCurrentOrganizationId();

    if (!organizationId) {
      throw new AuthenticationError(ERROR_CODES.NOT_AUTHENTICATED);
    }

    const { error } = await withTimeout<any>(
      supabase.from('animal_vaccines').insert({
        animal_id: request.animalId,
        organization_id: organizationId,
        name: request.name.trim(),
        status: request.status,
        date_taken: request.dateTaken || null,
        scheduled_date: request.scheduledDate || null,
        next_due_date: request.nextDueDate || null,
        notes: request.notes || null,
      }),
    );

    if (error) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }
  }

  /**
   * @description
   * Confirma que uma vacina pendente foi tomada.
   */
  async confirmTaken(vaccineId: string, dateTaken: string): Promise<void> {
    const organizationId = this.authService.getCurrentOrganizationId();

    if (!organizationId) {
      throw new AuthenticationError(ERROR_CODES.NOT_AUTHENTICATED);
    }

    const { error } = await withTimeout<any>(
      supabase
        .from('animal_vaccines')
        .update({
          status: 'tomada',
          date_taken: dateTaken,
        })
        .eq('id', vaccineId)
        .eq('organization_id', organizationId),
    );

    if (error) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }
  }

  /**
   * @description
   * Remove uma vacina associada a um animal.
   */
  async delete(vaccineId: string): Promise<void> {
    const organizationId = this.authService.getCurrentOrganizationId();

    if (!organizationId) {
      throw new AuthenticationError(ERROR_CODES.NOT_AUTHENTICATED);
    }

    const { error } = await withTimeout<any>(
      supabase
        .from('animal_vaccines')
        .delete()
        .eq('id', vaccineId)
        .eq('organization_id', organizationId),
    );

    if (error) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }
  }
}
