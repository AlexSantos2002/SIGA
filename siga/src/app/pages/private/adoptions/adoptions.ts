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
    const request: RegisterAdoptionRequest = {
      adopterId: 'be4e63e1-ecb9-4092-ae54-e8484a1de0da',
      animalId: 'a170aefa-04e2-4dca-a615-0f98dd871cff',
      status: 'pendente',
      applicationDate: '2026-04-23 16:35:49.641019+00',
      decisionDate: '2026-04-24 16:50:49.641019+00'
    }

    try {
      const adoption = await this.adoptionService
        .register(this.currentUser.organizationId, request)

      console.log(adoption);
    } catch (err) {
      console.log(err);
    }
  }


  /**
   * Busca todas as adoções da organização
   */
  async getAll(): Promise<void> {
    try {
        const adoptions: Adoption[] = await this.adoptionService
          .getAll(this.currentUser.organizationId);

      console.log(adoptions);
    } catch (err) {
      console.log(err);
    }
  }


  /**
   * Busca uma adoção pelo ID
   */
  async getById(): Promise<void> {
    try {
      const adoptionId = '4a370536-76a2-4ba8-9c01-c1aab7ee2a85'
      const adoption: Adoption = await this.adoptionService.getById(
        adoptionId,
        this.currentUser.organizationId);

      console.log(adoption);
    } catch (err) {
      console.log(err);
    }
  }


  /**
   * Busca as adoções por status
   */
  async getByStatus(): Promise<void> {
    const status = 'aceita';

    try {
        const adoptions: Adoption[] = await this.adoptionService.getByStatus(
          status,
          this.currentUser.organizationId);

      console.log(adoptions);
    } catch (err) {
      console.log(err);
    }
  }


  /**
   * Busca as adoções de um determinado adotante
   */
  async getByAdopterId(): Promise<void> {
    const id = 'be4e63e1-ecb9-4092-ae54-e8484a1de0da';
    try {
      const adoption: Adoption[] = await this.adoptionService.getByAdopterId(
        id,
        this.currentUser.organizationId,
      );

      console.log(adoption);
    } catch (err) {
      console.log(err);
    }
  }


  /**
   * Atualiza o estado de uma adoção
   */
  async updateAdoption(): Promise<void> {
    const request: UpdateAdoptionRequest = {
      adoptionId: '06641b02-ccd0-4376-96a9-231b4c2fcfea',
      newStatus: 'rejeitada',
      decisionDate: '2026-04-27 16:35:49.641019+00',
    }

    try {
        const updatedAdoption: Adoption = await this.adoptionService.update(
          request,
          this.currentUser.organizationId
        );
      console.log(updatedAdoption);
    } catch (err) {
      console.log(err);
    }
  }
}
