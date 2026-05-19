import { Injectable } from '@angular/core';

import { supabase } from '../../../../supabase/supabase';
import { Animal } from '../../models/animal/animal.model';

@Injectable({
  providedIn: 'root',
})
export class AnimalService {
  /**
   * @description
   * Obtém o ID da organização associada ao utilizador autenticado.
   */
  private async getCurrentOrganizationId(): Promise<string | null> {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return null;
    }

    const { data, error } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (error || !data) {
      console.error('Erro ao obter organização:', error?.message);
      return null;
    }

    return data.organization_id;
  }

  /**
   * @description
   * Converte um animal vindo da base de dados para o modelo usado no frontend.
   */
  private mapAnimal(animal: any): Animal {
    return {
      id: animal.id,
      name: animal.name,
      species: animal.species,
      breed: animal.breed,
      gender: animal.gender,
      birthDate: animal.birth_date,
      available: animal.available,
      status: animal.status,
      createdAt: animal.created_at,
    };
  }

  /**
   * @description
   * Obtém todos os animais registados na organização autenticada.
   */
  async getAnimalsFromCurrentOrganization(): Promise<Animal[]> {
    const organizationId = await this.getCurrentOrganizationId();

    if (!organizationId) {
      return [];
    }

    const { data, error } = await supabase
      .from('animals')
      .select(`
        id,
        name,
        gender,
        birth_date,
        available,
        status,
        created_at,
        species:species_id (
          id,
          name
        ),
        breed:breed_id (
          id,
          name
        )
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar animais:', error.message);
      return [];
    }

    return (data ?? []).map((animal) => this.mapAnimal(animal));
  }

  /**
   * @description
   * Obtém um animal pelo ID, garantindo que pertence à organização indicada.
   */
  async getById(animalId: string, organizationId: string): Promise<Animal> {
    const { data, error } = await supabase
      .from('animals')
      .select(`
        id,
        name,
        gender,
        birth_date,
        available,
        status,
        created_at,
        species:species_id (
          id,
          name
        ),
        breed:breed_id (
          id,
          name
        )
      `)
      .eq('id', animalId)
      .eq('organization_id', organizationId)
      .single();

    if (error || !data) {
      console.error('Erro ao obter animal:', error?.message);
      throw new Error('Animal não encontrado.');
    }

    return this.mapAnimal(data);
  }

  /**
   * @description
   * Marca um animal como indisponível numa organização.
   */
  async makeAnimalUnavailable(
    animalId: string,
    organizationId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('animals')
      .update({
        available: false,
        status: 'indisponivel',
      })
      .eq('id', animalId)
      .eq('organization_id', organizationId);

    if (error) {
      console.error('Erro ao marcar animal como indisponível:', error.message);
      throw error;
    }
  }
}