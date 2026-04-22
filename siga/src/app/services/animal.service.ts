import { Injectable } from '@angular/core';
import { RegisterAnimalRequest } from '../models/animal/RegisterAnimalRequest';
import { supabase } from '../../../supabase/supabase';
import { AnimalResponse } from '../models/animal/AnimalResponse';
import { AnimalFilters } from '../models/animal/AnimalFilters';
import { EditAnimalRequest } from '../models/animal/EditAnimalRequest';


@Injectable({
  providedIn: 'root',
})
export class AnimalService {

  /**
   * Regista um novo animal
   * @param request contém os dados do animal
   */
  async registerAnimal(request: RegisterAnimalRequest): Promise<any> {
    const {data: animalData, error: animalError} = await supabase
      .from("animals")
      .insert([{
        name: request.name,
        species_id: request.speciesId,
        breed_id: request.breedId,
        gender: request.gender,
        birth_date: request.birthDate,
        available: request.available,
        organization_id: request.organizationId
      }]).select().single();

    if (animalError || !animalData || animalData.length === 0) {
      throw animalError || new Error("Animal não foi criado");
    }

    return animalData;
  }

  /**
   * Faz a busca por animais baseada em filtros como gênero,
   * espécie, raça e disponibilidade.
   * @param filters filtro com diferentes critérios para busca
   */
  async searchAnimals(filters: AnimalFilters): Promise<AnimalResponse[]> {
    let query = supabase
      .from('animals')
      // Busca os valores da tabela breeds e speciess
      .select(`
    *,
    species:species_id (
      name
    ),
    breed:breed_id (
      name
    )
  `).eq('organization_id', filters.organizationId);

    // Filtra a espécie
    if (filters.species) {
      query = query.eq('species', filters.species);
    }

    // Filtra o gênero
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
    const { data: animal, error } = await supabase
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
      species:species_id (name),
      breed:breed_id (name)
    `)
      .single();

    if (error) throw error;

    return this.toAnimalResponse(animal);
  }


  async createAnimalBreed() {

  }

  async fetchAnimalBreeds() {

  }

  /**
   * Converte a resposta do supabase para AnimalResponse
   * @param response response enviada pelo supabase
   */
  toAnimalResponse(response: any): AnimalResponse {
    return {
      id: response.id,
      name: response.name,
      species: response.species.name,
      breed: response.breed.name,
      gender: response.gender,
      birthDate: response.birth_date,
      available: response.available,
      createdAt: response.created_at,
    };
  }
}
