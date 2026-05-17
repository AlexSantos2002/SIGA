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
  async register(organizationId: string, request: RegisterAnimalRequest): Promise<Animal> {
    const {data, error} = await supabase
      .from("animals")
      .insert({
        name: request.name,
        species_id: request.speciesId,
        breed_id: request.breedId,
        gender: request.gender,
        birth_date: request.birthDate,
        available: request.status === 'por_adotar',
        status: request.status,
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

    // Filtra o estado
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    // Filtra a raça
    if (filters.breedId) {
      query = query.eq('breed_id', filters.breedId);
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

    const { data, error } = await supabase
      .from('animals')
      .update({
        name: request.name,
        species_id: request.speciesId,
        breed_id: request.breedId,
        gender: request.gender,
        birth_date: request.birthDate,
        available: request.status ? request.status === 'por_adotar' : request.available,
        status: request.status,
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

    if (error || !data) throw DBError;

    return this.toAnimal(data);
  }


  /**
   * Atualiza o estado de um animal
   */
  async updateStatus(animalId: string, organizationId: string, status: string): Promise<Animal> {
    return await this.update(animalId, organizationId, {
      status: status,
      available: status === 'por_adotar',
    });
  }


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
      status: 'indisponivel',
    };

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
      status: response.status,
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