import { Injectable } from '@angular/core';
import {supabase} from '../../../supabase/supabase';

@Injectable({
  providedIn: 'root',
})
export class OrganizationService {

  /**
   * Cria uma organizacao com nome, email, numero e morada
   * @param name
   * @param email
   * @param phone
   * @param address
   */
  async createOrganization(name: string, email?: string, phone?: string, address?: string) {
    const { data, error } = await supabase
      .from('organizations')
      .insert([{ name, email, phone, address }])
      .select();
    if (error) throw error;
    return data[0];
  }


  /**
   * Retorna as organizacoes disponiveis
   */
  async getOrganizations() {
    const { data, error } = await supabase.from('organizations').select('*');
    if (error) throw error;
    return data;
  }
}
