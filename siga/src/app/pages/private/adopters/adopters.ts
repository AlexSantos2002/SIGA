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
export class Adopters implements OnInit {

  // Utilizador atual
  private currentUser!: User;

  constructor(private authService: AuthService, private adopterService: AdoptersService) {
  }

  /**
   * Inicializa o utilizador atual para
   * efetuar requests
   */
  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser() as User;
  }

  /**
   * Regista um novo adotante
   */
  async register(): Promise<void> {
    // TODO: Obter dados do adotante através de formulário
    const request: RegisterAdopterRequest = {
      name: 'Nicolas',
      lastName: 'Garcia',
      email: 'nicolas@email.com',
      phone: '123456789',
    }

    try {
        const adopter = await this.adopterService
          .register(this.currentUser.organizationId,request);
      console.log(adopter);

      // TODO: Mostrar mensagem de adotante criado
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
        .getAll(this.currentUser.organizationId);

      console.log(adopters);
      // TODO: Adicionar adotantes a lista ou lista vazia
    } catch (err) {
      // TODO: Mostrar mensagem de erro
      console.log(err);
    }
  }


  /**
   * Busca um adotante específico
   */
  async getAdopterById(): Promise<void> {
    // TODO: Obter ID através da página/dropdown
    const id = 'be4e63e1-ecb9-4092-ae54-e8484a1de0da';

    try {
      const adopter = await this.adopterService
        .getById(id, this.currentUser.organizationId);

      console.log(adopter);
    } catch (err) {
      console.log(err);
    }
  }


  /**
   * Edita um adotante
   */
  async editAdopter(): Promise<void> {
    // TODO: Obter ID através da página/dropdown
    const id = 'be4e63e1-ecb9-4092-ae54-e8484a1de0da';

    // TODO: Obter dados de atualização através de formulário
    const request: UpdateAdopterRequest = {
      name: 'NICOLAS',
      lastName: 'GARCIA',
      email: 'EMAIL@EMAIL.com',
      phone: '999999999'
    }

    try {
        const updatedAdopter =  await this.adopterService
          .update(id, this.currentUser.organizationId, request)

      // TODO: Adicionar mensagem de adotante atualizado
      console.log(updatedAdopter);
    } catch (err) {
      // TODO: Implementar mensagem de erro
    }
  }


  /**
   * Deleta um adotante
   */
  async deleteAdopter(): Promise<void> {
    // TODO: Obter ID através da página/dropdown
    const id = '40826e21-543f-4808-b01f-9efac30879f4';
    try {
      // TODO: Implementar mensagem de sucesso
      await this.adopterService.delete(id);
      console.log('Adotante deletado');
    } catch (err) {
      // TODO: Implementar mensagem de erro
      console.log('Erro ao deletar adotante');
    }
  }
}
