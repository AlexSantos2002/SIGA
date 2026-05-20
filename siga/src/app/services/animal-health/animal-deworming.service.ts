import { Injectable } from '@angular/core';

import { supabase } from '../../../../supabase/supabase';
import { AnimalDeworming } from '../../models/animal/animal-deworming.model';
import { RegisterAnimalDewormingRequest } from '../../models/animal/register-animal-deworming-request';

@Injectable({
  providedIn: 'root',
})
export class AnimalDewormingService {
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
  async getByAnimalId(animalId: string): Promise<AnimalDeworming[]> {
    const organizationId = await this.getCurrentOrganizationId();

    if (!organizationId) {
      return [];
    }

    const { data, error } = await this.withTimeout<any>(
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
        .order('created_at', { ascending: false })
    );

    if (error) {
      console.error('Erro ao carregar desparasitações:', error.message);
      return [];
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
    const organizationId = await this.getCurrentOrganizationId();

    if (!organizationId) {
      throw new Error('Organização não encontrada.');
    }

    const { error } = await this.withTimeout<any>(
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
      console.error('Erro ao criar desparasitação:', error.message);
      throw error;
    }
  }

  /**
   * @description
   * Remove um registo de desparasitação.
   */
  async delete(dewormingId: string): Promise<void> {
    const organizationId = await this.getCurrentOrganizationId();

    if (!organizationId) {
      throw new Error('Organização não encontrada.');
    }

    const { error } = await this.withTimeout<any>(
      supabase
        .from('animal_deworming')
        .delete()
        .eq('id', dewormingId)
        .eq('organization_id', organizationId)
    );

    if (error) {
      console.error('Erro ao eliminar desparasitação:', error.message);
      throw error;
    }
  }
}