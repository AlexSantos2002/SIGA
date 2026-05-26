import { Component, OnInit } from '@angular/core';
import { AdoptersService } from '../../../services/adopter/adopters.service';
import { User } from '../../../models/user/user.model';
import { AuthService } from '../../../services/auth/auth.service';
import { RegisterAdopterRequest } from '../../../models/adopter/register-adopter-request';
import { UpdateAdopterRequest } from '../../../models/adopter/update-adopter-request';

@Component({
  selector: 'app-adopters',
  imports: [],
  templateUrl: './adopters.html',
  styleUrl: './adopters.css',
})
export class Adopters {

  constructor(private adopterService: AdoptersService) {
  }
  /**
   * Regista um novo adotante
   */
  async register(): Promise<void> {
    const request: RegisterAdopterRequest = {
      name: 'Nicolas',
      lastName: 'Garcia',
      email: 'nicolas@email.com',
      phone: '123456789',
    }

    try {
        const adopter = await this.adopterService.register(request);

      console.log(adopter);
    } catch (err) {
      console.log(err);
    }
  }


  /**
   * Busca todos os adotantes da organização
   */
  async getAdopters(): Promise<void> {
    try {
      const adopters = await this.adopterService
        .getAll();

      console.log(adopters);
    } catch (err) {
      console.log(err);
    }
  }


  /**
   * Busca um adotante específico
   */
  async getAdopterById(): Promise<void> {
    const id = 'be4e63e1-ecb9-4092-ae54-e8484a1de0db';

    try {
      const adopter = await this.adopterService
        .getById(id);

      console.log(adopter);
    } catch (err) {
      console.log(err);
    }
  }


  /**
   * Edita um adotante
   */
  async editAdopter(): Promise<void> {
    const id = 'be4e63e1-ecb9-4092-ae54-e8484a1de0da';

    const request: UpdateAdopterRequest = {
      name: 'NICOLAS',
      lastName: 'GARCIA',
      email: 'EMAIL@EMAIL.com',
      phone: '999999999'
    }

    try {
        const updatedAdopter =  await this.adopterService
          .update(id, request)

      console.log(updatedAdopter);
    } catch (err) {
      console.log(err);
    }
  }


  /**
   * Deleta um adotante
   */
  async deleteAdopter(): Promise<void> {
    const id = '40826e21-543f-4808-b01f-9efac30879f4';
    try {
      await this.adopterService.delete(id);
      console.log('Adotante deletado');
    } catch (err) {
      console.log(err);
    }
  }
}
