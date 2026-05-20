import { Injectable } from '@angular/core';

import { supabase } from '../../../../supabase/supabase';
import { AnimalVaccine } from '../../models/vaccines/animal-vaccines.model';
import { RegisterAnimalVaccineRequest } from '../../models/vaccines/register-animal-vaccine-request';

@Injectable({
  providedIn: 'root',
})
export class AnimalVaccineService {
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
    const organizationId = await this.getCurrentOrganizationId();

    if (!organizationId) {
      return [];
    }

    const { data, error } = await this.withTimeout<any>(
      supabase
        .from('animal_vaccines')
        .select(`
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
        `)
        .eq('animal_id', animalId)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
    );

    if (error) {
      console.error('Erro ao carregar vacinas:', error.message);
      return [];
    }

    return (data ?? []).map((vaccine: any) => this.mapVaccine(vaccine));
  }

  /**
   * @description
   * Cria uma nova vacina associada a um animal.
   */
  async create(request: RegisterAnimalVaccineRequest): Promise<void> {
    const organizationId = await this.getCurrentOrganizationId();

    if (!organizationId) {
      throw new Error('Organização não encontrada.');
    }

    const { error } = await this.withTimeout<any>(
      supabase.from('animal_vaccines').insert({
        animal_id: request.animalId,
        organization_id: organizationId,
        name: request.name.trim(),
        status: request.status,
        date_taken: request.dateTaken || null,
        scheduled_date: request.scheduledDate || null,
        next_due_date: request.nextDueDate || null,
        notes: request.notes || null,
      })
    );

    if (error) {
      console.error('Erro ao criar vacina:', error.message);
      throw error;
    }
  }

  /**
   * @description
   * Remove uma vacina associada a um animal.
   */
  async delete(vaccineId: string): Promise<void> {
    const organizationId = await this.getCurrentOrganizationId();

    if (!organizationId) {
      throw new Error('Organização não encontrada.');
    }

    const { error } = await this.withTimeout<any>(
      supabase
        .from('animal_vaccines')
        .delete()
        .eq('id', vaccineId)
        .eq('organization_id', organizationId)
    );

    if (error) {
      console.error('Erro ao eliminar vacina:', error.message);
      throw error;
    }
  }
}