import { Injectable } from '@angular/core';

import { supabase } from '../../../../supabase/supabase';
import { Animal } from '../../models/animal/animal.model';
import { RegisterAnimalRequest } from '../../models/animal/register-animal-request';
import { withTimeout } from '../../utils/utils';

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
    } = await withTimeout<any>(supabase.auth.getUser());

    if (userError || !user) {
      return null;
    }

    const { data, error } = await withTimeout<any>(
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

      generalNotes: animal.general_notes,
      medicalNotes: animal.medical_notes,

      sterilizationStatus: animal.sterilization_status,
      sterilizationDate: animal.sterilization_date,

      hasMicrochip: animal.has_microchip ?? false,
      microchipNumber: animal.microchip_number,
      microchipDate: animal.microchip_date,

      createdAt: animal.created_at,
    };
  }

  /**
   * @description
   * Define automaticamente se o animal fica disponível para adoção.
   */
  private getAvailabilityFromStatus(status: string): boolean {
    return status === 'por_adotar';
  }

  /**
   * @description
   * Procura uma espécie pelo nome ou cria uma nova para a organização.
   */
  private async getOrCreateSpecies(
    name: string,
    organizationId: string
  ): Promise<string> {
    const normalizedName = name.trim();

    const { data: existingSpecies, error: searchError } =
      await withTimeout<any>(
        supabase
          .from('species')
          .select('id')
          .eq('organization_id', organizationId)
          .ilike('name', normalizedName)
          .maybeSingle()
      );

    if (searchError) {
      console.error('Erro ao procurar espécie:', searchError.message);
      throw searchError;
    }

    if (existingSpecies) {
      return existingSpecies.id;
    }

    const { data: newSpecies, error: insertError } =
      await withTimeout<any>(
        supabase
          .from('species')
          .insert({
            name: normalizedName,
            organization_id: organizationId,
          })
          .select('id')
          .single()
      );

    if (insertError || !newSpecies) {
      console.error('Erro ao criar espécie:', insertError?.message);
      throw insertError;
    }

    return newSpecies.id;
  }

  /**
   * @description
   * Procura uma raça pelo nome ou cria uma nova para a organização e espécie.
   */
  private async getOrCreateBreed(
    name: string,
    speciesId: string,
    organizationId: string
  ): Promise<string> {
    const normalizedName = name.trim();

    const { data: existingBreed, error: searchError } =
      await withTimeout<any>(
        supabase
          .from('breeds')
          .select('id')
          .eq('organization_id', organizationId)
          .eq('species_id', speciesId)
          .ilike('name', normalizedName)
          .maybeSingle()
      );

    if (searchError) {
      console.error('Erro ao procurar raça:', searchError.message);
      throw searchError;
    }

    if (existingBreed) {
      return existingBreed.id;
    }

    const { data: newBreed, error: insertError } =
      await withTimeout<any>(
        supabase
          .from('breeds')
          .insert({
            name: normalizedName,
            species_id: speciesId,
            organization_id: organizationId,
          })
          .select('id')
          .single()
      );

    if (insertError || !newBreed) {
      console.error('Erro ao criar raça:', insertError?.message);
      throw insertError;
    }

    return newBreed.id;
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

    const { data, error } = await withTimeout<any>(
      supabase
        .from('animals')
        .select(`
          id,
          name,
          gender,
          birth_date,
          available,
          status,
          general_notes,
          medical_notes,
          sterilization_status,
          sterilization_date,
          has_microchip,
          microchip_number,
          microchip_date,
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
        .order('created_at', { ascending: false })
    );

    if (error) {
      console.error('Erro ao carregar animais:', error.message);
      return [];
    }

    return (data ?? []).map((animal: any) => this.mapAnimal(animal));
  }

  /**
   * @description
   * Regista um novo animal na organização autenticada.
   */
  async createAnimal(request: RegisterAnimalRequest): Promise<void> {
    const organizationId = await this.getCurrentOrganizationId();

    if (!organizationId) {
      throw new Error('Organização não encontrada.');
    }

    const speciesId = await this.getOrCreateSpecies(
      request.speciesName,
      organizationId
    );

    const breedId = await this.getOrCreateBreed(
      request.breedName,
      speciesId,
      organizationId
    );

    const { data, error } = await withTimeout<any>(
      supabase
        .from('animals')
        .insert({
          name: request.name.trim(),
          species_id: speciesId,
          breed_id: breedId,
          gender: request.gender,
          birth_date: request.birthDate,
          status: request.status,
          available: this.getAvailabilityFromStatus(request.status),
          organization_id: organizationId,

          general_notes: request.generalNotes ?? null,
          medical_notes: request.medicalNotes ?? null,

          sterilization_status: request.sterilizationStatus ?? null,
          sterilization_date: request.sterilizationDate ?? null,

          has_microchip: request.hasMicrochip ?? false,
          microchip_number: request.microchipNumber ?? null,
          microchip_date: request.microchipDate ?? null,
        })
        .select('id')
        .single()
    );

    if (error) {
      console.error('Erro ao criar animal:', error.message);
      throw error;
    }

    console.log('Animal criado:', data);
  }

  /**
   * @description
   * Obtém um animal pelo ID, garantindo que pertence à organização indicada.
   */
  async getById(animalId: string, organizationId: string): Promise<Animal> {
    const { data, error } = await withTimeout<any>(
      supabase
        .from('animals')
        .select(`
          id,
          name,
          gender,
          birth_date,
          available,
          status,
          general_notes,
          medical_notes,
          sterilization_status,
          sterilization_date,
          has_microchip,
          microchip_number,
          microchip_date,
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
        .single()
    );

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
    const { error } = await withTimeout<any>(
      supabase
        .from('animals')
        .update({
          available: false,
          status: 'indisponivel',
        })
        .eq('id', animalId)
        .eq('organization_id', organizationId)
    );

    if (error) {
      console.error('Erro ao marcar animal como indisponível:', error.message);
      throw error;
    }
  }

  /**
   * @description
   * Remove um animal da organização autenticada.
   */
  async deleteAnimal(animalId: string): Promise<void> {
    const organizationId = await this.getCurrentOrganizationId();

    if (!organizationId) {
      throw new Error('Organização não encontrada.');
    }

    const { error } = await withTimeout<any>(
      supabase
        .from('animals')
        .delete()
        .eq('id', animalId)
        .eq('organization_id', organizationId)
    );

    if (error) {
      console.error('Erro ao eliminar animal:', error.message);
      throw error;
    }
  }

  /**
   * @description
   * Obtém um animal pelo ID usando a organização autenticada.
   */
  async getAnimalFromCurrentOrganization(animalId: string): Promise<Animal> {
    const organizationId = await this.getCurrentOrganizationId();

    if (!organizationId) {
      throw new Error('Organização não encontrada.');
    }

    return this.getById(animalId, organizationId);
  }

  /**
   * @description
   * Atualiza os dados de um animal da organização autenticada.
   */
  async updateAnimal(
    animalId: string,
    request: RegisterAnimalRequest
  ): Promise<void> {
    const organizationId = await this.getCurrentOrganizationId();

    if (!organizationId) {
      throw new Error('Organização não encontrada.');
    }

    const speciesId = await this.getOrCreateSpecies(
      request.speciesName,
      organizationId
    );

    const breedId = await this.getOrCreateBreed(
      request.breedName,
      speciesId,
      organizationId
    );

    const { error } = await withTimeout<any>(
      supabase
        .from('animals')
        .update({
          name: request.name.trim(),
          species_id: speciesId,
          breed_id: breedId,
          gender: request.gender,
          birth_date: request.birthDate,
          status: request.status,
          available: this.getAvailabilityFromStatus(request.status),

          general_notes: request.generalNotes ?? null,
          medical_notes: request.medicalNotes ?? null,

          sterilization_status: request.sterilizationStatus ?? null,
          sterilization_date: request.sterilizationDate ?? null,

          has_microchip: request.hasMicrochip ?? false,
          microchip_number: request.microchipNumber ?? null,
          microchip_date: request.microchipDate ?? null,
        })
        .eq('id', animalId)
        .eq('organization_id', organizationId)
    );

    if (error) {
      console.error('Erro ao atualizar animal:', error.message);
      throw error;
    }
  }
}
