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
  async registerAnimal(request: RegisterAnimalRequest) {
    const {data: animalData, error: animalError} = await supabase
      .from("animals")
      .insert([{
        name: request.name,
        species: request.species,
        breed_id: request.breedId,
        gender: request.gender,
        birth_date: request.birthDate,
        status: request.status,
        organization_id: request.organizationId
      }]).select().single();

    if (animalError || !animalData || animalData.length === 0) {
      throw animalError || new Error("Animal não foi criado");
    }

    return animalData;
  }

}
