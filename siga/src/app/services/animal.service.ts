import { Injectable } from '@angular/core';
import { RegisterAnimalRequest } from '../models/RegisterAnimalRequest';
import { supabase } from '../../../supabase/supabase';


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
        species: request.species,
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
   * Retorna a lista com os animais pertencentes a organização
   * @param organizationId
   */
  async fetchAnimals(organizationId: string): Promise<any> {
    const {data: animals, error: error} = await supabase
      .from("animals")
      .select()
      .eq("organization_id", organizationId);

    if (error) throw error;

    return animals;
  }

  // TODO: Buscar animais disponiveis
  async fetchAvailableAnimals(organizationId: string, available: boolean = true): Promise<any> {
    const {data: availableAnimals, error: error} = await supabase
      .from("animals")
      .select()
      .eq("organization_id", organizationId)
      .eq('status', available);

    if (error) throw error;

    return availableAnimals;
  }

  // TODO: Fazer buscas por animais baseadas em critérios (gênero, espécie, etc)
}
