import { Injectable } from '@angular/core';

import { supabase } from '../../../../supabase/supabase';
import { Animal } from '../../models/animal/animal.model';
import { RegisterAnimalRequest } from '../../models/animal/register-animal-request';

@Injectable({
  providedIn: 'root',
})
export class AnimalService {
  /**
   * @description
   * Impede que uma chamada à Supabase fique presa indefinidamente.
   */
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

  /**
   * @description
   * Obtém o ID da organização associada ao utilizador autenticado.
   */
  async register(organizationId: string, request: RegisterAnimalRequest): Promise<Animal> {
    const {data, error} = await supabase
      .from("animals")
      .insert({
        name: request.name,
        species_id: request.speciesId,
        breed_id: request.breedId,
        gender: request.gender,
        birth_date: request.birthDate,
        available: request.available,
        organization_id: organizationId
      }).select(`
    *,
    species:species_id (
      id,
      name
    ),
    breed:breed_id (
      id,
      name
    )
  `).single();

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
      await this.withTimeout<any>(
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
      await this.withTimeout<any>(
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

    // Filtra a raça
    if (filters.breedId) {
      query = query.eq('breed_id', filters.breedId);
    }

    if (existingBreed) {
      return existingBreed.id;
    }

    const { data: newBreed, error: insertError } =
      await this.withTimeout<any>(
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

    const { data, error } = await this.withTimeout<any>(
      supabase
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
        .order('created_at', { ascending: false })
    );

    if (error) {
      console.error('Erro ao carregar animais:', error.message);
      return [];
    }

    const { data, error } = await supabase
      .from('animals')
      .update({
        name: request.name,
        species_id: request.speciesId,
        breed_id: request.breedId,
        gender: request.gender,
        birth_date: request.birthDate,
        available: request.available,
      })
      .eq('id', animalId)
      .eq('organization_id', organizationId)
      .select(`
      *,
      species:species_id (
        id,
        name
      ),
      breed:breed_id (
        id,
        name
      )
    `)
      .single();

  const organizationId = await this.getCurrentOrganizationId();

  if (!organizationId) {
    throw new Error('Organização não encontrada.');
  }

  console.log('Organização encontrada:', organizationId);

  /**
   * Torna um animal indisponível
   */
  async makeAnimalUnavailable(animalId: string, organizationId: string): Promise<Animal> {
    let animal: Animal = await this.getById(animalId, organizationId);

    const updatedAnimal: UpdateAnimalRequest = {
      name: animal.name,
      speciesId: animal.species.id,
      breedId: animal.breed.id,
      gender: animal.gender,
      birthDate: animal.birthDate,
      available: false,
    };

  const breedId = await this.getOrCreateBreed(
    request.breedName,
    speciesId,
    organizationId
  );

  console.log('Raça encontrada/criada:', breedId);

  console.log('A inserir animal...');

  const { data, error } = await this.withTimeout<any>(
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
    const { data, error } = await this.withTimeout<any>(
      supabase
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
    const { error } = await this.withTimeout<any>(
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

    return data.map(breed => this.toBreed(breed));
  }

  /**
   * Converte a resposta do supabase para Animal
   * @param response response enviada pelo supabase
   */
  private toAnimal(response: any): Animal {
    return {
      id: response.id,
      name: response.name,

      species: {
        id: response.species_id,
        name: response.species.name
      },

      breed: {
        id: response.breed_id,
        name: response.breed.name
      },

      gender: response.gender,
      birthDate: response.birth_date,
      available: response.available,
      createdAt: response.created_at,
    };
  }


  /**
   * Converte a resposta do supabase para Breed
   * @param response response enviada pelo supabase
   */
  private toBreed(response: any): Breed {
    return {
      id: response.id,
      name: response.name,

      species: {
        id: response.species_id,
        name: response.species.name
      }
    };
  }
}
