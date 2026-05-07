import { Injectable } from '@angular/core';
import { RegisterAdoptionRequest } from '../../models/adoption/register-adoption-request';
import { supabase } from '../../../../supabase/supabase';
import { Adoption } from '../../models/adoption/adoption.model';
import { AnimalService } from '../animal/animal.service';
import { UpdateAdoptionRequest } from '../../models/adoption/update-adoption-request';

@Injectable({
  providedIn: 'root',
})
export class AdoptionService {

  constructor(private animalService: AnimalService) {
  }

  /**
   * Regista uma adoção
   */
  async register(organizationId: string, request: RegisterAdoptionRequest): Promise<Adoption> {
    // Verifica se o animal está disponível para adoção
    const animal = await this.animalService
      .getById(request.animalId, organizationId);

    if (!animal.available) {
      throw new Error('O animal não está disponível para adoção')
    }

    const {data: adoption, error} = await supabase
      .from('adoptions')
      .insert({
        organization_id: organizationId,
        animal_id: request.animalId,
        adopter_id: request.adopterId,
        status: request.status,
        application_date: request.applicationDate,
        decision_date: request.decisionDate
      }).select(`
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
    `).single();

    if (error || !adoption) {
      throw error || new Error('Adoção não realizada');
    }

    // Atualiza o estado do animal caso a adoção já esteja aceita
    if (request.status === 'aceita') {
      await this.animalService.makeAnimalUnavailable(animal.id, organizationId);
    }

    return this.toAdoption(adoption)
  }


  /**
   * Retorna todas as adoções da organização
   */
  async getAll(organizationId: string): Promise<Adoption[]> {
    const {data: adoptions, error} = await supabase
      .from('adoptions')
      .select(`
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
      `).eq('organization_id', organizationId)

    if (error || !adoptions) {
      throw error;
    }

    return adoptions.map((adoption) => this.toAdoption(adoption));
  }

  /**
   * Obtém uma adoção pelo ID
   */
  async getById(adoptionId: string, organizationId: string): Promise<Adoption> {
    const { data: adoption, error } = await supabase
      .from('adoptions')
      .select(`
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
    `)
      .eq('id', adoptionId)
      .eq('organization_id', organizationId)
      .single();

    if (error || !adoption) {
      throw new Error('Adoção');
    }

    return this.toAdoption(adoption);
  }


  /**
   * Obtém adoções filtradas por status
   */
  async getByStatus(status: string, organizationId: string): Promise<Adoption[]> {
    const { data: adoptions, error } = await supabase
      .from('adoptions')
      .select(`
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
    `)
      .eq('organization_id', organizationId)
      .eq('status', status);

    if (error || !adoptions) {
      throw new Error('Erro ao obter adoções por estado', error);
    }

    return adoptions.map((adoption) => this.toAdoption(adoption));
  }


  /**
   * Obtém adoções de um adotante específico
   */
  async getByAdopterId(adopterId: string, organizationId: string): Promise<Adoption[]> {
    const { data: adoptions, error } = await supabase
      .from('adoptions')
      .select(`
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
    `)
      .eq('organization_id', organizationId)
      .eq('adopter_id', adopterId);

    if (error || !adoptions) {
      throw new Error('Erro ao obter adoções do adotante');
    }

    return adoptions.map((adoption) => this.toAdoption(adoption));
  }


  /**
   * Atualiza o estado de uma adoção
   */
  async updateStatus(request: UpdateAdoptionRequest, organizationId: string): Promise<Adoption> {
    const adoption = await this.getById(request.adoptionId, organizationId);

    if (!this.isValidStatusTransition(request.newStatus)) {
      throw new Error(`Não é possível alterar o estado de "${adoption.status}"
       para "${request.newStatus}"`);
    }

    const { data: updated, error } = await supabase
      .from('adoptions')
      .update({
        status: request.newStatus,
        decision_date: request.decisionDate ?? new Date().toISOString()
      })
      .eq('id', request.adoptionId)
      .eq('organization_id', organizationId)
      .select(`
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
    `)
      .single();

    if (error || !updated) {
      throw new Error('Erro ao atualizar estado da adoção', error);
    }

    // Caso seja aceita, muda o estado do animal
    if (request.newStatus === 'aceita') {
      await this.animalService.makeAnimalUnavailable(adoption.animal.id, organizationId);
    }

    return this.toAdoption(updated);
  }


  // TODO: Permitir a remoção de adoções aceitas/rejeitadas?
  /**
   * Remove uma adoção (apenas se estiver pendente)
   */
  async delete(adoptionId: string, organizationId: string): Promise<void> {
    const adoption = await this.getById(adoptionId, organizationId);

    // Apenas deleta caso o status seja pendente
    if (adoption.status !== 'pendente') {
      throw new Error(
        'Só é possível eliminar adoções com estado pendente',
      );
    }

    const { error } = await supabase
      .from('adoptions')
      .delete()
      .eq('id', adoptionId)
      .eq('organization_id', organizationId);

    if (error) {
      throw new Error('Erro ao eliminar adoção');
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
      decisionDate: response.decision_date
    }
  }

}
