import { Injectable } from '@angular/core';
import { RegisterAdoptionRequest } from '../../models/adoption/register-adoption-request';
import { supabase } from '../../../../supabase/supabase';
import { Adoption } from '../../models/adoption/adoption.model';
import { AnimalService } from '../animal/animal.service';
import { UpdateAdoptionRequest } from '../../models/adoption/update-adoption-request';
import { AuthenticationError, BusinessError, DBError, NotFoundError } from '../../error/app-error';
import { ERROR_CODES } from '../../error/error-codes';
import { SUPABASE_ERROR_CODES } from '../../error/supabase-error-codes';
import { AuthService } from '../auth/auth.service';
import { AdoptersService } from '../adopter/adopters.service';

@Injectable({
  providedIn: 'root',
})
export class AdoptionService {
  constructor(
    private authService: AuthService,
    private animalService: AnimalService,
    private adoptersService: AdoptersService,
  ) {}

  /**
   * Regista uma adoção
   */
  async register(request: RegisterAdoptionRequest): Promise<Adoption> {
    const organizationId = this.authService.getCurrentOrganizationId();

    if (!organizationId) {
      throw new AuthenticationError(ERROR_CODES.NOT_AUTHENTICATED);
    }

    // Verifica se o animal está disponível para adoção
    const adopter = await this.adoptersService.getById(request.adopterId);

    if (adopter.isFlagged) {
      throw new BusinessError(ERROR_CODES.ADOPTER_FLAGGED);
    }

    const animal = await this.animalService.getById(request.animalId);

    // Emite erro caso o animal não esteja disponível para adoção
    if (!animal.available) {
      throw new BusinessError(ERROR_CODES.ANIMAL_UNAVAILABLE);
    }

    const { data, error } = await supabase
      .from('adoptions')
      .insert({
        organization_id: organizationId,
        animal_id: request.animalId,
        adopter_id: request.adopterId,
        status: request.status,
        application_date: request.applicationDate,
        decision_date: request.decisionDate,
      })
      .select(
        `
      id,
      application_date,
      decision_date,
      status,
      animal:animal_id (
        id,
        name,
        gender,
        species:species_id (
          id,
          name
        ),
        breed:breed_id (
          id,
          name
        )
      ),
      adopter:adopter_id (
        id,
        name,
        email
      )
    `,
      )
      .single();

    if (error || !data) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }

    // Atualiza o estado do animal caso a adoção já esteja aceite
    if (request.status === 'aceita') {
      await this.animalService.makeAnimalUnavailable(animal.id);
    }

    return this.toAdoption(data);
  }

  /**
   * Retorna todas as adoções da organização
   */
  async getAll(): Promise<Adoption[]> {
    const organizationId = this.authService.getCurrentOrganizationId();

    const { data, error } = await supabase
      .from('adoptions')
      .select(
        `
        id,
        application_date,
        decision_date,
        status,
        animal:animal_id (
          id,
          name,
          gender,
          species:species_id (
            id,
            name
          ),
          breed:breed_id (
            id,
            name
          )
        ),
        adopter:adopter_id (
          id,
          name,
          email
        )
      `,
      )
      .eq('organization_id', organizationId);

    if (error) {
      throw new DBError(ERROR_CODES.UNABLE_TO_GET_ADOPTIONS);
    }

    return (data ?? []).map((adoption) => this.toAdoption(adoption));
  }

  /**
   * Obtém uma adoção pelo ID
   */
  async getById(adoptionId: string): Promise<Adoption> {
    const organizationId = this.authService.getCurrentOrganizationId();

    const { data, error } = await supabase
      .from('adoptions')
      .select(
        `
      id,
      application_date,
      decision_date,
      status,
      animal:animal_id (
        id,
        name,
        gender,
        species:species_id (id, name),
        breed:breed_id (id, name)
      ),
      adopter:adopter_id (
        id,
        name,
        email
      )
    `,
      )
      .eq('id', adoptionId)
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      throw new DBError(ERROR_CODES.UNABLE_TO_GET_ADOPTION);
    }

    return this.toAdoption(data);
  }

  /**
   * Obtém adoções filtradas por status
   */
  async getByStatus(status: string): Promise<Adoption[]> {
    const organizationId = this.authService.getCurrentOrganizationId();

    const { data, error } = await supabase
      .from('adoptions')
      .select(
        `
      id,
      application_date,
      decision_date,
      status,
      animal:animal_id (
        id,
        name,
        gender,
        species:species_id (id, name),
        breed:breed_id (id, name)
      ),
      adopter:adopter_id (
        id,
        name,
        email
      )
    `,
      )
      .eq('organization_id', organizationId)
      .eq('status', status);

    if (error) {
      throw new DBError(ERROR_CODES.UNABLE_TO_GET_ADOPTION);
    }

    return data.map((adoption) => this.toAdoption(adoption));
  }

  /**
   * Obtém adoções de um adotante específico
   */
  async getByAdopterId(adopterId: string): Promise<Adoption[]> {
    const organizationId = this.authService.getCurrentOrganizationId();

    const { data, error } = await supabase
      .from('adoptions')
      .select(
        `
      id,
      application_date,
      decision_date,
      status,
      animal:animal_id (
        id,
        name,
        gender,
        species:species_id (id, name),
        breed:breed_id (id, name)
      ),
      adopter:adopter_id (
        id,
        name,
        email
      )
    `,
      )
      .eq('organization_id', organizationId)
      .eq('adopter_id', adopterId);

    if (error || !data) {
      throw new DBError(ERROR_CODES.UNABLE_TO_GET_ADOPTION);
    }

    return data.map((adoption) => this.toAdoption(adoption));
  }

  /**
   * Atualiza o estado de uma adoção
   */
  async update(request: UpdateAdoptionRequest): Promise<Adoption> {
    const organizationId = this.authService.getCurrentOrganizationId();
    const adoption: Adoption = await this.getById(request.adoptionId);

    // Emite erro caso a transição de status da adoção seja inválida
    if (!this.isValidStatusTransition(request.newStatus)) {
      throw new BusinessError(ERROR_CODES.INVALID_STATUS_TRANSITION);
    }

    const { data, error } = await supabase
      .from('adoptions')
      .update({
        status: request.newStatus,
        decision_date: request.decisionDate ?? new Date().toISOString(),
      })
      .eq('id', request.adoptionId)
      .eq('organization_id', organizationId)
      .select(
        `
      id,
      application_date,
      decision_date,
      status,
      animal:animal_id (
        id,
        name,
        gender,
        species:species_id (id, name),
        breed:breed_id (id, name)
      ),
      adopter:adopter_id (
        id,
        name,
        email
      )
    `,
      )
      .single();

    if (error) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }

    // Caso seja aceite, muda o estado do animal
    if (request.newStatus === 'aceita') {
      await this.animalService.makeAnimalUnavailable(adoption.animal.id);
    }

    return this.toAdoption(data);
  }

  // TODO: Permitir a remoção de adoções aceitas/rejeitadas?
  /**
   * Remove uma adoção (apenas se estiver pendente)
   */
  async delete(adoptionId: string): Promise<void> {
    const organizationId = this.authService.getCurrentOrganizationId();
    const adoption: Adoption = await this.getById(adoptionId);

    // Apenas deleta caso o status seja pendente
    if (adoption.status !== 'pendente') {
      throw new Error('Só é possível eliminar adoções com estado pendente');
    }

    const { error } = await supabase
      .from('adoptions')
      .delete()
      .eq('id', adoptionId)
      .eq('organization_id', organizationId);

    if (error) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }
  }

  // TODO: Permitir mudança de aceita para rejeitada por exemplo?
  /**
   * Valida se a transição de estado é permitida.
   */
  private isValidStatusTransition(newStatus: string): boolean {
    const allowedTransitions = ['aceita', 'rejeitada', 'pendente'];
    return allowedTransitions.includes(newStatus) ?? false;
  }

  /**
   * Converte a response do supabase para um Adoption model
   */
  private toAdoption(response: any): Adoption {
    return {
      id: response.id,
      adopter: response.adopter,
      animal: response.animal,
      status: response.status,
      applicationDate: response.application_date,
      decisionDate: response.decision_date,
    };
  }
}
