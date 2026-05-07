import { Component, OnInit } from '@angular/core';
import { AdoptionService } from '../../../services/adoption/adoption.service';
import { AuthService } from '../../../services/auth/auth.service';
import { User } from '../../../models/user/user.model';
import { RegisterAdoptionRequest } from '../../../models/adoption/register-adoption-request';
import { Adoption } from '../../../models/adoption/adoption.model';
import { UpdateAdoptionRequest } from '../../../models/adoption/update-adoption-request';

@Component({
  selector: 'app-adoptions',
  imports: [],
  templateUrl: './adoptions.html',
  styleUrl: './adoptions.css',
})
export class Adoptions implements OnInit {

  private currentUser!: User;

  constructor(
    private authService: AuthService,
    private adoptionService: AdoptionService,
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser() as User;
  }


  /**
   * Regista uma nova adoção
   */
  async register(): Promise<void> {
    // TODO: Obter dados através de formulário
    const request: RegisterAdoptionRequest = {
      adopterId: 'be4e63e1-ecb9-4092-ae54-e8484a1de0da',
      animalId: '0631320c-f027-427f-ba4d-45271b5fa97e',
      status: 'aceita',
      applicationDate: '2026-04-23 16:35:49.641019+00',
      decisionDate: '2026-04-23 16:35:49.641019+00'
    }

    try {
      const adoption = await this.adoptionService
        .register(this.currentUser.organizationId, request)

      console.log(adoption);
    } catch (err) {
      // TODO: Implementar mensagem de erro
      console.log(err);
    }
  }


  /**
   * Busca todas as adoções da organização
   */
  async getAll(): Promise<void> {
    try {
      // TODO: Implementar lista de adoções
        const adoptions: Adoption[] = await this.adoptionService.getAll(this.currentUser.organizationId);
      console.log(adoptions);
    } catch (err) {
      // TODO: Mostrar mensagem de erro
      console.log(err);
    }
  }


  /**
   * Busca uma adoção pelo ID
   */
  async getById(): Promise<void> {
    try {
     // TODO: Obter dados da adoção através da página/dropdown
      const adoptionId = '4a370536-76a2-4ba8-9c01-c1aab7ee2a85'
      const adoption: Adoption = await this.adoptionService.getById(
        adoptionId,
        this.currentUser.organizationId);
      console.log(adoption);
    } catch (err) {
      // TODO: Mostrar mensagem de erro
      console.log(err);
    }
  }


  /**
   * Busca as adoções por status
   */
  async getByStatus(): Promise<void> {
    // TODO: Obter status através de dropdown/página
    const status = 'aceita';

    try {
        const adoptions: Adoption[] = await this.adoptionService.getByStatus(
          status,
          this.currentUser.organizationId);

        // TODO: Atualizar lista  de adoções
      console.log(adoptions);
    } catch (err) {
      // TODO: Mostrar mensagem de erro
      console.log(err);
    }
  }


  /**
   * Busca as adoções de um determinado adotante
   */
  async getByAdopterId(): Promise<void> {
    // TODO: Obter ID do adotante através de página/dropdown
    const id = 'be4e63e1-ecb9-4092-ae54-e8484a1de0da';
    try {
      const adoption: Adoption[] = await this.adoptionService.getByAdopterId(
        id,
        this.currentUser.organizationId,
      );
      console.log(adoption);
      // TODO: Atualizar ou redirecionar para página da adoção
    } catch (err) {
      // TODO: Mostrar mensagem de erro
      console.log(err);
    }
  }


  /**
   * Atualiza o estado de uma adoção
   */
  async updateAdoptionStatus(): Promise<void> {
    // TODO: Obter dados através de formulário
    const request: UpdateAdoptionRequest = {
      adoptionId: '4a370536-76a2-4ba8-9c01-c1aab7ee2a85',
      newStatus: 'aceita',
      decisionDate: '2026-04-23 16:35:49.641019+00',
    }

    try {
        const updatedAdoption: Adoption = await this.adoptionService.updateStatus(
          request,
          this.currentUser.organizationId
        );
      // TODO: Atualizar adoção UI
      console.log(updatedAdoption);
    } catch (err) {
      // TODO: Mostrar mensagem de erro
    }
  }
}
