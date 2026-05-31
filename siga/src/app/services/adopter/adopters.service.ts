import { Injectable } from '@angular/core';
import { Adopter } from '../../models/adopter/adopter.model';
import { supabase } from '../../../../supabase/supabase';
import { RegisterAdopterRequest } from '../../models/adopter/register-adopter-request';
import { UpdateAdopterRequest } from '../../models/adopter/update-adopter-request';
import { AuthenticationError, BusinessError, DBError, NotFoundError } from '../../error/app-error';
import { SUPABASE_ERROR_CODES } from '../../error/supabase-error-codes';
import { ERROR_CODES } from '../../error/error-codes';
import { AuthService } from '../auth/auth.service';
import { Adoption } from '../../models/adoption/adoption.model';

@Injectable({
  providedIn: 'root',
})
export class AdoptersService {

  constructor(private authService: AuthService) {
  }

  private mapToAdopter(adopter: any): Adopter {
    return {
      id: adopter.id,
      name: adopter.name,
      lastName: adopter.last_name,
      email: adopter.email,
      phone: adopter.phone,
      createdAt: adopter.created_at
    }
  }

  /**
   * Retorna todos os adotantes da organização
   */
  async getAll(): Promise<Adopter[]> {
    const organizationId = this.authService.getCurrentOrganizationId();

    if (!organizationId) {
      throw new AuthenticationError(ERROR_CODES.NOT_AUTHENTICATED);
    }

    const { data, error } = await supabase
      .from('adopters')
      .select('*')
      .eq('organization_id', organizationId);

    if (error) {
     throw new DBError(ERROR_CODES.UNABLE_TO_GET_ADOPTERS);
    }

    return (data ?? []).map(adopter => this.mapToAdopter(adopter));
  }


  /**
   * Retorna um adotante a partir de seu ID
   * @param adopterId id do adotante
   */
  async getById(adopterId: string): Promise<Adopter> {
    const organizationId = this.authService.getCurrentOrganizationId();

    if (!organizationId) {
      throw new AuthenticationError(ERROR_CODES.NOT_AUTHENTICATED);
    }

    const { data, error } = await supabase
      .from('adopters')
      .select('*')
      .eq('id', adopterId)
      .eq('organization_id', organizationId)
      .single();

    if (error?.code === SUPABASE_ERROR_CODES.NO_ROWS_RETURNED || !data) {
      throw new NotFoundError(ERROR_CODES.UNABLE_TO_GET_ADOPTER);
    }

    if (error) {
      throw new DBError(ERROR_CODES.UNABLE_TO_GET_ADOPTER);
    }

    return this.mapToAdopter(data);
  }


  /**
   * Regista um novo adotante na organização
   * @param request contém a informação para registar um adotante
   */
  async register(request: RegisterAdopterRequest): Promise<Adopter> {
    const organizationId = this.authService.getCurrentOrganizationId();

    const { data, error } = await supabase
      .from('adopters')
      .insert({
        name: request.name,
        last_name: request.lastName,
        email: request.email,
        phone: request.phone,
        organization_id: organizationId
      })
      .select()
      .single();

    // Retorna erro se o email já existe nos adotantes
    if (error?.code === SUPABASE_ERROR_CODES.UNIQUE_VIOLATION) {
      throw new BusinessError(ERROR_CODES.EMAIL_ALREADY_EXISTS);
    }

    if (error) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }

    return this.mapToAdopter(data);
  }


  /**
   * Atualiza os dados de um adotante
   * @param adopterId id do adotante a ser atualizado
   * @param request contém os novos dados para atualização
   */
  async update(adopterId: string, request: UpdateAdopterRequest): Promise<Adopter> {
    const organizationId = this.authService.getCurrentOrganizationId();

    const { data, error } = await supabase
      .from('adopters')
      .update({
        name: request.name,
        last_name: request.lastName,
        email: request.email,
        phone: request.phone,
      })
      .eq('id', adopterId)
      .eq('organization_id', organizationId)
      .select()
      .single();

    // Verifica se o email já existe nos adotantes
    if (error?.code === SUPABASE_ERROR_CODES.UNIQUE_VIOLATION) {
      throw new BusinessError(ERROR_CODES.EMAIL_ALREADY_EXISTS);
    }

    if (error) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }

    return data;
  }

  // TODO: Verificar se possui adoções antes de deletar
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('adopters').delete().eq('id', id);

    if (error) {
      throw new DBError(ERROR_CODES.DB_ERROR_UPDATE);
    }
  }
}
