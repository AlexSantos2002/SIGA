import { Injectable } from '@angular/core';
import { RegisterAdoptionRequest } from '../../models/adoption/register-adoption-request';
import { supabase } from '../../../../supabase/supabase';
import { Adoption } from '../../models/adoption/adoption.model';
import { Adopter } from '../../models/adopter/adopter.model';
import { AnimalService } from '../animal/animal.service';
import { UpdateAdoptionRequest } from '../../models/adoption/update-adoption-request';
import { AuthenticationError, BusinessError, DBError } from '../../error/app-error';
import { ERROR_CODES } from '../../error/error-codes';
import { AuthService } from '../auth/auth.service';
import { AdoptersService } from '../adopter/adopters.service';
import { AnimalCareService } from '../animal-health/animal-care.service';

@Injectable({
  providedIn: 'root',
})
export class AdoptionService {
  private readonly adoptionSelect = `
    id,
    application_date,
    decision_date,
    status,
    animal:animal_id (
      id,
      name,
      gender,
      status,
      available,
      image_path,
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
      last_name,
      email,
      phone,
      document_type,
      document_number,
      birth_date,
      address,
      city,
      postal_code,
      housing_type,
      has_outdoor_space,
      has_other_animals,
      other_animals_description,
      household_members,
      employment_status,
      experience_with_animals,
      preferred_species,
      adoption_motivation,
      notes,
      is_flagged,
      flag_reason,
      flagged_at,
      created_at
    )
  `;

  constructor(
    private authService: AuthService,
    private animalService: AnimalService,
    private adoptersService: AdoptersService,
    private animalCareService: AnimalCareService,
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
      .select(this.adoptionSelect)
      .single();

    if (error || !data) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }

    // Atualiza o estado do animal caso a adoção já esteja aceite
    if (request.status === 'aceita') {
      await this.finalizeAnimalAdoption(animal.id);
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
      .select(this.adoptionSelect)
      .eq('organization_id', organizationId)
      .order('decision_date', { ascending: false, nullsFirst: false })
      .order('application_date', { ascending: false });

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
      .select(this.adoptionSelect)
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
      .select(this.adoptionSelect)
      .eq('organization_id', organizationId)
      .eq('status', status)
      .order('decision_date', { ascending: false, nullsFirst: false })
      .order('application_date', { ascending: false });

    if (error) {
      throw new DBError(ERROR_CODES.UNABLE_TO_GET_ADOPTION);
    }

    return (data ?? []).map((adoption) => this.toAdoption(adoption));
  }

  /**
   * Obtém adoções de um adotante específico
   */
  async getByAdopterId(adopterId: string): Promise<Adoption[]> {
    const organizationId = this.authService.getCurrentOrganizationId();

    const { data, error } = await supabase
      .from('adoptions')
      .select(this.adoptionSelect)
      .eq('organization_id', organizationId)
      .eq('adopter_id', adopterId)
      .order('decision_date', { ascending: false, nullsFirst: false })
      .order('application_date', { ascending: false });

    if (error || !data) {
      throw new DBError(ERROR_CODES.UNABLE_TO_GET_ADOPTION);
    }

    return (data ?? []).map((adoption) => this.toAdoption(adoption));
  }

  /**
   * Obtem a adocao aceite associada ao animal, caso exista.
   */
  async getAcceptedByAnimalId(animalId: string): Promise<Adoption | null> {
    const organizationId = this.authService.getCurrentOrganizationId();

    if (!organizationId) {
      throw new AuthenticationError(ERROR_CODES.NOT_AUTHENTICATED);
    }

    const { data, error } = await supabase
      .from('adoptions')
      .select(this.adoptionSelect)
      .eq('organization_id', organizationId)
      .eq('animal_id', animalId)
      .eq('status', 'aceita')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new DBError(ERROR_CODES.UNABLE_TO_GET_ADOPTION);
    }

    return data ? this.toAdoption(data) : null;
  }

  /**
   * Liga um animal adotado ao adotante que o adotou.
   */
  async linkAcceptedAdoptionToAnimal(animalId: string, adopterId: string): Promise<Adoption> {
    const organizationId = this.authService.getCurrentOrganizationId();

    if (!organizationId) {
      throw new AuthenticationError(ERROR_CODES.NOT_AUTHENTICATED);
    }

    const [animal, adopter] = await Promise.all([
      this.animalService.getById(animalId),
      this.adoptersService.getById(adopterId),
    ]);

    if (adopter.isFlagged) {
      throw new BusinessError(ERROR_CODES.ADOPTER_FLAGGED);
    }

    const existingAdoption = await this.getAcceptedByAnimalId(animal.id);
    const now = new Date().toISOString();

    const request = existingAdoption
      ? supabase
          .from('adoptions')
          .update({
            adopter_id: adopter.id,
            status: 'aceita',
            decision_date: now,
          })
          .eq('id', existingAdoption.id)
          .eq('organization_id', organizationId)
      : supabase.from('adoptions').insert({
          organization_id: organizationId,
          animal_id: animal.id,
          adopter_id: adopter.id,
          status: 'aceita',
          application_date: now,
          decision_date: now,
        });

    const { data, error } = await request.select(this.adoptionSelect).single();

    if (error || !data) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }

    await this.finalizeAnimalAdoption(animal.id);

    return this.toAdoption(data);
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

    if (request.newStatus === 'devolvida' && adoption.status !== 'aceita') {
      throw new BusinessError(ERROR_CODES.INVALID_STATUS_TRANSITION);
    }

    const decisionDate = request.decisionDate ?? new Date().toISOString();
    const updatePayload: Record<string, string> = {
      status: request.newStatus,
    };

    if (request.newStatus !== 'devolvida') {
      updatePayload['decision_date'] = decisionDate;
    }

    const { data, error } = await supabase
      .from('adoptions')
      .update(updatePayload)
      .eq('id', request.adoptionId)
      .eq('organization_id', organizationId)
      .select(this.adoptionSelect)
      .single();

    if (error) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }

    // Caso seja aceite, muda o estado do animal
    if (request.newStatus === 'aceita') {
      await this.finalizeAnimalAdoption(adoption.animal.id);

      const { error: rejectPendingError } = await supabase
        .from('adoptions')
        .update({
          status: 'rejeitada',
          decision_date: decisionDate,
        })
        .eq('organization_id', organizationId)
        .eq('animal_id', adoption.animal.id)
        .eq('status', 'pendente')
        .neq('id', request.adoptionId);

      if (rejectPendingError) {
        throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
      }
    }

    if (request.newStatus === 'devolvida') {
      await this.animalService.markAnimalAsAvailableForAdoption(adoption.animal.id);
    }

    return this.toAdoption(data);
  }

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

  /**
   * Valida se a transição de estado é permitida.
   */
  private isValidStatusTransition(newStatus: string): boolean {
    const allowedTransitions = ['aceita', 'rejeitada', 'pendente', 'devolvida'];
    return allowedTransitions.includes(newStatus) ?? false;
  }

  private async finalizeAnimalAdoption(animalId: string): Promise<void> {
    await this.animalService.markAnimalAsAdopted(animalId);
    await this.animalCareService.clearScheduledCareForAdoptedAnimal(animalId);
  }

  /**
   * Converte a response do supabase para um Adoption model
   */
  private toAdoption(response: any): Adoption {
    return {
      id: response.id,
      adopter: this.toAdopter(response.adopter),
      animal: this.toAdoptionAnimal(response.animal),
      status: response.status,
      applicationDate: response.application_date,
      decisionDate: response.decision_date,
    };
  }

  private toAdoptionAnimal(response: any): Adoption['animal'] {
    return {
      id: response.id,
      name: response.name,
      gender: response.gender,
      status: response.status,
      available: response.available,
      imagePath: response.image_path ?? null,
      species: response.species,
      breed: response.breed,
    };
  }

  private toAdopter(response: any): Adopter {
    if (!response) {
      return {
        id: '',
        name: 'Adotante removido',
        lastName: '',
        email: '',
        hasOutdoorSpace: false,
        hasOtherAnimals: false,
        isFlagged: false,
        createdAt: '',
      };
    }

    return {
      id: response.id,
      name: response.name,
      lastName: response.last_name ?? '',
      email: response.email,
      phone: response.phone,
      documentType: response.document_type,
      documentNumber: response.document_number,
      birthDate: response.birth_date,
      address: response.address,
      city: response.city,
      postalCode: response.postal_code,
      housingType: response.housing_type,
      hasOutdoorSpace: response.has_outdoor_space ?? false,
      hasOtherAnimals: response.has_other_animals ?? false,
      otherAnimalsDescription: response.other_animals_description,
      householdMembers: response.household_members,
      employmentStatus: response.employment_status,
      experienceWithAnimals: response.experience_with_animals,
      preferredSpecies: response.preferred_species,
      adoptionMotivation: response.adoption_motivation,
      notes: response.notes,
      isFlagged: response.is_flagged ?? false,
      flagReason: response.flag_reason,
      flaggedAt: response.flagged_at,
      createdAt: response.created_at,
    };
  }
}
