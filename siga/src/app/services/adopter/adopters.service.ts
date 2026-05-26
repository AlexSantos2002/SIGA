import { Injectable } from '@angular/core';
import { Adopter } from '../../models/adopter/adopter.model';
import { supabase } from '../../../../supabase/supabase';
import { RegisterAdopterRequest } from '../../models/adopter/register-adopter-request';
import { UpdateAdopterRequest } from '../../models/adopter/update-adopter-request';
import { BusinessError, DBError, NotFoundError } from '../../error/app-error';
import { SUPABASE_ERROR_CODES } from '../../error/supabase-error-codes';
import { ERROR_CODES } from '../../error/error-codes';
import { RegisterOrganizationRequest } from '../../models/auth/register-organization-request';
import { AuthApiError } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root',
})
export class AdoptersService {


  async getAll(organizationId: string): Promise<Adopter[]> {
    const { data, error } = await supabase
      .from('adopters')
      .select('*')
      .eq('organization_id', organizationId);

    if (error || !data) throw new DBError();

    return data;
  }

  async getById(adopterId: string, organizationId: string): Promise<Adopter> {
    const { data, error } = await supabase
      .from('adopters')
      .select('*')
      .eq('id', adopterId)
      .eq('organization_id', organizationId)
      .single();

    if (error?.code === SUPABASE_ERROR_CODES.NO_ROWS_RETURNED) {
      throw new NotFoundError();
    }

    if (error || !data) throw new DBError();

    return data;
  }

  async register(organizationId: string, request: RegisterAdopterRequest): Promise<Adopter> {
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

    // Verifica se o email já existe nos adotantes
    if (error?.code === SUPABASE_ERROR_CODES.UNIQUE_VIOLATION) {
      throw new BusinessError(ERROR_CODES.EMAIL_ALREADY_EXISTS);
    }

    if (error || !data) throw new DBError();

    return data;
  }

  async update(adopterId: string, organizationId: string, request: UpdateAdopterRequest): Promise<Adopter> {
    const { data, error } = await supabase
      .from('adopters')
      .update({
        name: request.name,
        last_name: request.lastName,
        email: request.email,
        phone: request.phone
      })
      .eq('id', adopterId)
      .eq('organization_id', organizationId)
      .select()
      .single();

    // Verifica se o email já existe nos adotantes
    if (error?.code === SUPABASE_ERROR_CODES.UNIQUE_VIOLATION) {
      throw new BusinessError(ERROR_CODES.EMAIL_ALREADY_EXISTS);
    }

    if (error || !data) throw new DBError();

    return data;
  }

  // TODO: Verificar se possui adoções antes de deletar
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('adopters')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
