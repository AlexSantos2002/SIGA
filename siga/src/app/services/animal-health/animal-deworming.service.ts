import { Injectable } from '@angular/core';

import { supabase } from '../../../../supabase/supabase';
import { AnimalDeworming } from '../../models/animal/animal-deworming.model';
import { RegisterAnimalDewormingRequest } from '../../models/animal/register-animal-deworming-request';
import { withTimeout } from '../../utils/utils';
import { AuthService } from '../auth/auth.service';
import { AuthenticationError, DBError } from '../../error/app-error';
import { ERROR_CODES } from '../../error/error-codes';

@Injectable({
  providedIn: 'root',
})
export class AnimalDewormingService {

  constructor(private authService: AuthService) {
  }

  private mapDeworming(deworming: any): AnimalDeworming {
    return {
      id: deworming.id,
      animalId: deworming.animal_id,
      organizationId: deworming.organization_id,
      type: deworming.type,
      dateDone: deworming.date_done,
      nextDueDate: deworming.next_due_date,
      productName: deworming.product_name,
      notes: deworming.notes,
      createdAt: deworming.created_at,
    };
  }

  /**
   * @description
   * Obtém os registos de desparasitação associados a um animal.
   */
  async getByAnimalId(animalId: string, timeoutMs = 10000): Promise<AnimalDeworming[]> {
    const organizationId = this.authService.getCurrentOrganizationId();

    if (!organizationId) {
      throw new AuthenticationError(ERROR_CODES.NOT_AUTHENTICATED);
    }

    const { data, error } = await withTimeout<any>(
      supabase
        .from('animal_deworming')
        .select(`
          id,
          animal_id,
          organization_id,
          type,
          date_done,
          next_due_date,
          product_name,
          notes,
          created_at
        `)
        .eq('animal_id', animalId)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false }),
      timeoutMs,
    );

    if (error) {
      throw new DBError(ERROR_CODES.UNABLE_TO_GET_DEWORMING);
    }

    return (data ?? []).map((deworming: any) =>
      this.mapDeworming(deworming)
    );
  }

  /**
   * @description
   * Cria um registo de desparasitação associado a um animal.
   */
  async create(request: RegisterAnimalDewormingRequest): Promise<void> {
    const organizationId = this.authService.getCurrentOrganizationId();

    if (!organizationId) {
      throw new AuthenticationError(ERROR_CODES.NOT_AUTHENTICATED);
    }

    const { error } = await withTimeout<any>(
      supabase.from('animal_deworming').insert({
        animal_id: request.animalId,
        organization_id: organizationId,
        type: request.type,
        date_done: request.dateDone,
        next_due_date: request.nextDueDate || null,
        product_name: request.productName || null,
        notes: request.notes || null,
      })
    );

    if (error) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }
  }

  /**
   * @description
   * Remove um registo de desparasitação.
   */
  async delete(dewormingId: string): Promise<void> {
    const organizationId = this.authService.getCurrentOrganizationId();

    if (!organizationId) {
      throw new AuthenticationError(ERROR_CODES.NOT_AUTHENTICATED);
    }

    const { error } = await withTimeout<any>(
      supabase
        .from('animal_deworming')
        .delete()
        .eq('id', dewormingId)
        .eq('organization_id', organizationId)
    );

    if (error) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }
  }
}
