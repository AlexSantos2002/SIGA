import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AnimalService } from '../../../services/animal.service';
import { RegisterAnimalRequest } from '../../../models/RegisterAnimalRequest';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-animals',
  imports: [],
  templateUrl: './animals.html',
  styleUrl: './animals.css',
})
export class Animals {
  animalForm: FormGroup;

  // TODO: Obter ID da organização através do usuário

  constructor(
    private fb: FormBuilder,
    private animalService: AnimalService,
    private authService: AuthService,
  ) {
    this.animalForm = this.fb.group({
      name: ['', Validators.required],
      species: ['', Validators.required],
      breedId: [null],
      gender: ['', Validators.required],
      birthDate: [''],
      status: ['available', Validators.required],
    });
  }

  // TODO: Permitir que apenas utilizadores autenticados insiram animais

  async register() {
    try {
      await this.authService.loadUserFromSession();

      const user = this.authService.getCurrentUser();
      if (!user) {
        throw new Error('Utilizador não autenticado');
      }

      const request = {
        name: 'Rex',
        species: 'Dog',
        breedId: 'e9a7cdb8-7d06-4246-a9d9-3c5c471270e1',
        gender: 'male',
        birthDate: '2022-01-01',
        status: 'available',
        organizationId: user.organizationId,
      };

      const animal = await this.animalService.registerAnimal(request);
      console.log('Animal criado:', animal);
    } catch (error) {
      console.error('Erro:', error);
    }
  }
}
