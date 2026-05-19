import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

import { Animal } from '../../../models/animal/animal.model';
import { AnimalService } from '../../../services/animal/animal.service';

@Component({
  selector: 'app-animals',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './animals.html',
  styleUrl: './animals.css',
})
export class Animals implements OnInit {
  animals: Animal[] = [];

  isLoading = true;
  errorMessage = '';

  constructor(
    private animalService: AnimalService,
    private cdr: ChangeDetectorRef
  ) {}

  /**
   * @description
   * Carrega os animais quando a página é aberta.
   */
  async ngOnInit(): Promise<void> {
    await this.loadAnimals();
  }

  /**
   * @description
   * Obtém os animais da organização autenticada.
   */
  private async loadAnimals(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      this.cdr.detectChanges();

      this.animals = await this.animalService.getAnimalsFromCurrentOrganization();
    } catch (error) {
      console.error('Erro na página Animals:', error);
      this.errorMessage = 'Não foi possível carregar os animais.';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * @description
   * Converte o género guardado na base de dados para texto legível.
   */
  getGenderLabel(gender: string | null): string {
    const labels: Record<string, string> = {
      male: 'Macho',
      female: 'Fêmea',
      macho: 'Macho',
      femea: 'Fêmea',
    };

    return gender ? labels[gender] ?? gender : '—';
  }

  /**
   * @description
   * Converte o estado guardado na base de dados para texto legível.
   */
  getStatusLabel(status: string | null): string {
    const labels: Record<string, string> = {
      por_adotar: 'Por adotar',
      adotado: 'Adotado',
      em_tratamento: 'Em tratamento',
      reservado: 'Reservado',
      acolhimento: 'Em acolhimento',
      indisponivel: 'Indisponível',
    };

    return status ? labels[status] ?? status : '—';
  }
}