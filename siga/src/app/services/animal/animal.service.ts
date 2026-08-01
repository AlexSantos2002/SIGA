import { Injectable } from '@angular/core';

import { supabase } from '../../../../supabase/supabase';
import { Animal } from '../../models/animal/animal.model';
import { RegisterAnimalRequest } from '../../models/animal/register-animal-request';
import { withTimeout } from '../../utils/utils';
import { AuthService } from '../auth/auth.service';
import { AuthenticationError, DBError } from '../../error/app-error';
import { ERROR_CODES } from '../../error/error-codes';

@Injectable({
  providedIn: 'root',
})
export class AnimalService {
  constructor(private authService: AuthService) {}

  /**
   * @description
   * Converte um animal vindo da base de dados para o modelo usado no frontend.
   */
  private mapAnimal(animal: any): Animal {
    return {
      id: animal.id,
      name: animal.name,
      organizationName: animal.organization?.name ?? null,
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

      imagePath: animal.image_path,

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
  private async getOrCreateSpecies(name: string): Promise<string> {
    const organizationId = this.authService.getCurrentOrganizationId();

    if (!organizationId) {
      throw new AuthenticationError(ERROR_CODES.NOT_AUTHENTICATED);
    }

    const normalizedName = name.trim();

    const { data: existingSpecies, error: searchError } = await withTimeout<any>(
      supabase
        .from('species')
        .select('id')
        .eq('organization_id', organizationId)
        .ilike('name', normalizedName)
        .maybeSingle(),
    );

    if (searchError) {
      throw new DBError(ERROR_CODES.UNABLE_TO_GET_SPECIES);
    }

    if (existingSpecies) {
      return existingSpecies.id;
    }

    const { data: newSpecies, error: insertError } = await withTimeout<any>(
      supabase
        .from('species')
        .insert({
          name: normalizedName,
          organization_id: organizationId,
        })
        .select('id')
        .single(),
    );

    if (insertError) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }

    return newSpecies.id;
  }

  /**
   * @description
   * Procura uma raça pelo nome ou cria uma nova para a organização e espécie.
   */
  private async getOrCreateBreed(name: string, speciesId: string): Promise<string> {
    const organizationId = this.authService.getCurrentOrganizationId();

    if (!organizationId) {
      throw new AuthenticationError(ERROR_CODES.NOT_AUTHENTICATED);
    }

    const normalizedName = name.trim();

    const { data: existingBreed, error: searchError } = await withTimeout<any>(
      supabase
        .from('breeds')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('species_id', speciesId)
        .ilike('name', normalizedName)
        .maybeSingle(),
    );

    if (searchError) {
      throw new DBError(ERROR_CODES.UNABLE_TO_GET_BREEDS);
    }

    if (existingBreed) {
      return existingBreed.id;
    }

    const { data: newBreed, error: insertError } = await withTimeout<any>(
      supabase
        .from('breeds')
        .insert({
          name: normalizedName,
          species_id: speciesId,
          organization_id: organizationId,
        })
        .select('id')
        .single(),
    );

    if (insertError) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }

    return newBreed.id;
  }

  /**
   * @description
   * Obtém todos os animais registados na organização autenticada.
   */
  async getAnimalsFromCurrentOrganization(): Promise<Animal[]> {
    const organizationId = this.authService.getCurrentOrganizationId();

    if (!organizationId) {
      throw new AuthenticationError(ERROR_CODES.NOT_AUTHENTICATED);
    }

    const { data, error } = await withTimeout<any>(
      supabase
        .from('animals')
        .select(
          `
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
          image_path,
          organization:organization_id (
            name
          ),
          species:species_id (
            id,
            name
          ),
          breed:breed_id (
            id,
            name
          )
        `,
        )
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false }),
    );

    if (error) {
      throw new DBError(ERROR_CODES.UNABLE_TO_GET_ANIMALS);
    }

    return (data ?? []).map((animal: any) => this.mapAnimal(animal));
  }

  /**
   * @description
   * Regista um novo animal na organização autenticada.
   */
  async createAnimal(request: RegisterAnimalRequest): Promise<Animal> {
    const organizationId = this.authService.getCurrentOrganizationId();

    if (!organizationId) {
      throw new AuthenticationError(ERROR_CODES.NOT_AUTHENTICATED);
    }

    const speciesId = await this.getOrCreateSpecies(request.speciesName);

    const breedId = await this.getOrCreateBreed(request.breedName, speciesId);

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
        .single(),
    );

    if (error) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }

    return this.mapAnimal(data);
  }

  /**
   * @description
   * Obtém um animal pelo ID, garantindo que pertence à organização indicada.
   */
  async getById(animalId: string): Promise<Animal> {
    const organizationId = this.authService.getCurrentOrganizationId();

    if (!organizationId) {
      throw new AuthenticationError(ERROR_CODES.NOT_AUTHENTICATED);
    }

    const { data, error } = await withTimeout<any>(
      supabase
        .from('animals')
        .select(
          `
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
          image_path,
          organization:organization_id (
            name
          ),
          species:species_id (
            id,
            name
          ),
          breed:breed_id (
            id,
            name
          )
        `,
        )
        .eq('id', animalId)
        .eq('organization_id', organizationId)
        .single(),
    );

    if (error) {
      throw new DBError(ERROR_CODES.UNABLE_TO_GET_ANIMAL);
    }

    return this.mapAnimal(data);
  }

  /**
   * @description
   * Marca um animal como indisponível numa organização.
   */
  async makeAnimalUnavailable(animalId: string): Promise<void> {
    const organizationId = this.authService.getCurrentOrganizationId();

    if (!organizationId) {
      throw new AuthenticationError(ERROR_CODES.NOT_AUTHENTICATED);
    }

    const { error } = await withTimeout<any>(
      supabase
        .from('animals')
        .update({
          available: false,
          status: 'indisponivel',
        })
        .eq('id', animalId)
        .eq('organization_id', organizationId),
    );

    if (error) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }
  }

  /**
   * @description
   * Marca um animal como adotado numa organizaÃ§Ã£o.
   */
  async markAnimalAsAdopted(animalId: string): Promise<void> {
    const organizationId = this.authService.getCurrentOrganizationId();

    if (!organizationId) {
      throw new AuthenticationError(ERROR_CODES.NOT_AUTHENTICATED);
    }

    const { error } = await withTimeout<any>(
      supabase
        .from('animals')
        .update({
          available: false,
          status: 'adotado',
        })
        .eq('id', animalId)
        .eq('organization_id', organizationId),
    );

    if (error) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }
  }

  /**
   * @description
   * Volta a disponibilizar um animal para adopcao depois de uma devolucao.
   */
  async markAnimalAsAvailableForAdoption(animalId: string): Promise<void> {
    const organizationId = this.authService.getCurrentOrganizationId();

    if (!organizationId) {
      throw new AuthenticationError(ERROR_CODES.NOT_AUTHENTICATED);
    }

    const { error } = await withTimeout<any>(
      supabase
        .from('animals')
        .update({
          available: true,
          status: 'por_adotar',
        })
        .eq('id', animalId)
        .eq('organization_id', organizationId),
    );

    if (error) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }
  }

  /**
   * @description
   * Remove um animal da organização autenticada.
   */
  async deleteAnimal(animalId: string): Promise<void> {
    const organizationId = this.authService.getCurrentOrganizationId();

    if (!organizationId) {
      throw new AuthenticationError(ERROR_CODES.NOT_AUTHENTICATED);
    }

    const { error } = await withTimeout<any>(
      supabase.from('animals').delete().eq('id', animalId).eq('organization_id', organizationId),
    );

    if (error) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }
  }

  /**
   * @description
   * Obtém um animal pelo ID usando a organização autenticada.
   */
  async getAnimalFromCurrentOrganization(animalId: string): Promise<Animal> {
    const organizationId = this.authService.getCurrentOrganizationId();

    if (!organizationId) {
      throw new AuthenticationError(ERROR_CODES.NOT_AUTHENTICATED);
    }

    return this.getById(animalId);
  }

  /**
   * @description
   * Atualiza os dados de um animal da organização autenticada.
   */
  async updateAnimal(animalId: string, request: RegisterAnimalRequest): Promise<void> {
    const organizationId = this.authService.getCurrentOrganizationId();

    if (!organizationId) {
      throw new AuthenticationError(ERROR_CODES.NOT_AUTHENTICATED);
    }

    const speciesId = await this.getOrCreateSpecies(request.speciesName);

    const breedId = await this.getOrCreateBreed(request.breedName, speciesId);

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
        .eq('organization_id', organizationId),
    );

    if (error) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }
  }
}
