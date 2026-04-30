import { Injectable } from '@angular/core';
import { Adopter } from '../../models/adopter/adopter.model';
import { supabase } from '../../../../supabase/supabase';
import { RegisterAdopterRequest } from '../../models/adopter/register-adopter-request';
import { UpdateAdopterRequest } from '../../models/adopter/update-adopter-request';

@Injectable({
  providedIn: 'root',
})
export class AdoptersService {


  async getAll(organizationId: string): Promise<Adopter[]> {
    const { data, error } = await supabase
      .from('adopters')
      .select('*')
      .eq('organization_id', organizationId);

    if (error) throw error;
    return data;
  }

  async getById(adopterId: string, organizationId: string): Promise<Adopter> {
    const { data, error } = await supabase
      .from('adopters')
      .select('*')
      .eq('id', adopterId)
      .eq('organization_id', organizationId)
      .single();

    if (error) throw error;
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

    if (error) throw error;
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

    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('adopters')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

}
