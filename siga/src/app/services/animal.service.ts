import { Injectable } from '@angular/core';
import { RegisterAnimalRequest } from '../models/animal/RegisterAnimalRequest';
import { supabase } from '../../../supabase/supabase';
import { AnimalResponse } from '../models/animal/AnimalResponse';
import { AnimalFilters } from '../models/animal/AnimalFilters';
import { EditAnimalRequest } from '../models/animal/EditAnimalRequest';
import { CreateBreedRequest } from '../models/animal/CreateBreedRequest';
import { BreedResponse } from '../models/animal/BreedResponse';


@Injectable({
  providedIn: 'root',
})
export class AnimalService {

  /**
   * Regista um novo animal
   * @param request contém os dados do animal
   */
  async registerAnimal(request: RegisterAnimalRequest): Promise<AnimalResponse> {
    const {data: animalData, error} = await supabase
      .from("animals")
      .insert({
        name: request.name,
        species_id: request.speciesId,
        breed_id: request.breedId,
        gender: request.gender,
        birth_date: request.birthDate,
        available: request.available,
        organization_id: request.organizationId
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

    return this.toAnimalResponse(animalData);
  }

  /**
   * Faz a busca por animais baseada em filtros como género,
   * espécie, raça e disponibilidade.
   * @param filters filtro com diferentes critérios para busca
   */
  async searchAnimals(filters: AnimalFilters): Promise<AnimalResponse[]> {
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
  `).eq('organization_id', filters.organizationId);

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

    return animals.map((animal) => this.toAnimalResponse(animal)) || [];
  }


  /**
   * Edita um animal existente
   * @param animalId id do animal a ser editado
   * @param request request contendo as informações a serem atualizadas
   */
  async editAnimal(animalId: string, request: EditAnimalRequest): Promise<AnimalResponse> {
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
      .eq('organization_id', request.organizationId)
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

    return this.toAnimalResponse(animalData);
  }


  /**
   * Cria uma raça de animal para a organização
   */
  async createAnimalBreed(request: CreateBreedRequest): Promise<BreedResponse> {
    const {data: breedData, error} = await supabase
      .from('breeds')
      .insert({
        name: request.name,
        species_id: request.speciesId,
        organization_id: request.organizationId
      }).select().single();

    if (error || !breedData || breedData.length === 0) {
      throw error || new Error("Raça não foi criada");
    }

    return this.toBreedResponse(breedData);
  }


  /**
   * Busca as raças de animais disponíveis
   */
  async getAnimalBreeds(organizationId: string) {
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

    return breeds.map((breed) => this.toBreedResponse(breed));
  }


  /**
   * Busca as raças de animais com base na
   * espécie. Ex: para cães: Rottweiler, Dobermann, ...
   */
  async getAnimalBreedsBasedOnSpecies() {

  }

  /**
   * Converte a resposta do supabase para AnimalResponse
   * @param response response enviada pelo supabase
   */
  private toAnimalResponse(response: any): AnimalResponse {
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
   * Converte a resposta do supabase para BreedResponse
   * @param response response enviada pelo supabase
   */
  private toBreedResponse(response: any): BreedResponse {
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
