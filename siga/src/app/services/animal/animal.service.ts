import { Injectable } from '@angular/core';
import { RegisterAnimalRequest } from '../../models/animal/register-animal-request';
import { supabase } from '../../../../supabase/supabase';
import { Animal } from '../../models/animal/animal.model';
import { AnimalFilters } from '../../models/animal/animal-filters';
import { UpdateAnimalRequest } from '../../models/animal/update-animal-request';
import { RegisterBreedRequest } from '../../models/breed/register-breed-request';
import { Breed } from '../../models/breed/breed.model';
import { BusinessError, DBError, NotFoundError } from '../../error/app-error';
import { data } from 'autoprefixer';
import { SUPABASE_ERROR_CODES } from '../../error/supabase-error-codes';
import { ERROR_CODES } from '../../error/error-codes';
import { AdoptionService } from '../adoption/adoption.service';

@Injectable({
  providedIn: 'root',
})
export class AnimalService {

  // TODO: Refatorar tabela de animais para ter campo "isAdopted"

  /**
   * Regista um novo animal
   */
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
      throw new DBError();
    }

    return this.toAnimal(data);
  }


  /**
   * Busca um animal pelo seu ID
   */
  async getById(animalId: string, organizationId: string): Promise<Animal> {
    const {data, error} = await supabase
      .from('animals')
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
      .eq('id', animalId)
      .eq('organization_id', organizationId)
      .single();

    if (error?.code === SUPABASE_ERROR_CODES.NO_ROWS_RETURNED) throw new NotFoundError();

    if (error || !data) throw new DBError();

    return this.toAnimal(data);
  }

  /**
   * Faz a busca por animais baseada em filtros como género,
   * espécie, raça e disponibilidade.
   * @param filters filtro com diferentes critérios para busca
   */
  async search(organizationId: string, filters: AnimalFilters): Promise<Animal[]> {
    let query = supabase
      .from('animals')
      // Busca os valores da tabela breeds e species
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
  `).eq('organization_id', organizationId);

    // Filtra a espécie
    if (filters.species) {
      query = query.eq('species_id', filters.species);
    }

    // Filtra o género
    if (filters.gender) {
      query = query.eq('gender', filters.gender);
    }

    // Filtra a disponibilidade
    if (filters.available !== undefined) {
      query = query.eq('available', filters.available);
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
      await this.withTimeout<any>(
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

    const { data, error } = await query;

    if (error || !data) throw new DBError();

    return data.map((animal) => this.toAnimal(animal)) || [];
  }


  // TODO: Impedir mudança de "isAvailable = true" caso o animal esteja adotado
  /**
   * Edita um animal existente
   */
  async update(animalId: string, organizationId: string, request: UpdateAnimalRequest): Promise<Animal> {
    const animal: Animal = await this.getById(animalId, organizationId);


    // if (animal.isAdopted && request.available === true) {
    //   throw new BusinessError(ERROR_CODES.ANIMAL_UNAVAILABLE);
    // }

    return (data ?? []).map((animal: any) => this.mapAnimal(animal));
  }

/**
 * @description
 * Regista um novo animal na organização autenticada.
 */
async createAnimal(request: RegisterAnimalRequest): Promise<void> {
  console.log('A obter organização atual...');

    if (error || !data) throw DBError;

    return this.toAnimal(data);
  }


  console.log('A procurar/criar espécie:', request.speciesName);

  const speciesId = await this.getOrCreateSpecies(
    request.speciesName,
    organizationId
  );

  console.log('Espécie encontrada/criada:', speciesId);

  console.log('A procurar/criar raça:', request.breedName);

    return await this.update(animalId,
      organizationId, updatedAnimal);
  }


  /**
   * Cria uma raça de animal para a organização
   */
  async registerBreed(organizationId: string, request: RegisterBreedRequest): Promise<Breed> {
    const { data, error } = await supabase
      .from('breeds')
      .insert({
        name: request.name,
        species_id: request.speciesId,
        organization_id: organizationId
      })
      .select(`
      *,
      species:species_id (
        id,
        name
      )
      `)
      .single();

    if (error || !data) {
      throw new Error();
    }

    return this.toBreed(data);
  }


  /**
   * Busca as raças de animais disponíveis
   */
  async getAllBreeds(organizationId: string): Promise<Breed[]> {
    const {data, error} = await supabase
      .from('breeds')
      .select(
        `
        *,
        species:species_id (
          id,
          name
        )`
      )
      .eq('organization_id', organizationId)

    if (error || !data) {
      throw new DBError();
    }

    return data.map((breed) => this.toBreed(breed));
  }


  /**
   * Busca as raças de animais com base na
   * espécie. Ex: para cães: Rottweiler, Dobermann, ...
   */
  async getBreedsBasedOnSpecies(speciesId: string, organizationId: string): Promise<Breed[]> {
    const { data, error } = await supabase
      .from('breeds')
      .select('*, species:species_id (name)')
      .eq('species_id', speciesId)
      .eq('organization_id', organizationId);

    if (error || !data) {
      throw new DBError();
    }
  }
}