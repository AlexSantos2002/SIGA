import { Injectable } from '@angular/core';
import { RegisterAnimalRequest } from '../../models/animal/register-animal-request';
import { supabase } from '../../../../supabase/supabase';
import { Animal } from '../../models/animal/animal.model';
import { AnimalFilters } from '../../models/animal/animal-filters';
import { UpdateAnimalRequest } from '../../models/animal/update-animal-request';
import { RegisterBreedRequest } from '../../models/breed/register-breed-request';
import { Breed } from '../../models/breed/breed.model';

@Injectable({
  providedIn: 'root',
})
export class AnimalService {

  // TODO: Refatorar métodos para garantir consistência (obter o ID da organização separadamente)

  /**
   * Regista um novo animal
   */
  async register(organizationId: string, request: RegisterAnimalRequest): Promise<Animal> {
    const {data: animalData, error} = await supabase
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

    if (error || !animalData) {
      throw error || new Error("Animal não foi criado");
    }

    return this.toAnimal(animalData);
  }


  /**
   * Busca um animal pelo seu ID
   */
  async getById(animalId: string, organizationId: string): Promise<Animal> {
    const {data: animal, error} = await supabase
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

    if (error) throw error;

    return this.toAnimal(animal);
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

    if (filters.available !== undefined) {
      query = query.eq('available', filters.available);
    }

    if (filters.breedId) {
      query = query.eq('breed_id', filters.breedId);
    }

    const { data: animals, error } = await query;

    if (error) throw error;

    return animals.map((animal) => this.toAnimal(animal)) || [];
  }


  /**
   * Edita um animal existente
   * @param animalId id do animal a ser editado
   * @param request request contendo as informações a serem atualizadas
   */
  async update(animalId: string, organizationId: string, request: UpdateAnimalRequest): Promise<Animal> {
    const { data: animalData, error } = await supabase
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

    if (error) throw error;

    return this.toAnimal(animalData);
  }


  /**
   * Cria uma raça de animal para a organização
   */
  async registerBreed(organizationId: string, request: RegisterBreedRequest): Promise<Breed> {
    const { data: breedData, error } = await supabase
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

    if (error || !breedData) {
      throw error || new Error("Raça não foi criada");
    }

    return this.toBreed(breedData);
  }


  /**
   * Busca as raças de animais disponíveis
   */
  async getAllBreeds(organizationId: string) {
    const {data: breeds, error} = await supabase
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

    if (error || !breeds) {
      throw error || new Error('Não foi possível obter as raças disponíveis');
    }

    return breeds.map((breed) => this.toBreed(breed));
  }


  /**
   * Busca as raças de animais com base na
   * espécie. Ex: para cães: Rottweiler, Dobermann, ...
   */
  async getBreedsBasedOnSpecies(speciesId: string, organizationId: string) {
    const { data: breeds, error } = await supabase
      .from('breeds')
      .select('*, species:species_id (name)')
      .eq('species_id', speciesId)
      .eq('organization_id', organizationId);

    if (error || !breeds) {
      throw error || new Error('Não foi possível obter as raças');
    }

    return breeds.map(breed => this.toBreed(breed));
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
