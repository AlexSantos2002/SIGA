import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AnimalService } from '../../../services/animal.service';
import { AuthService } from '../../../services/auth.service';
import { supabase } from '../../../../../supabase/supabase';

@Component({
  selector: 'app-animals',
  imports: [],
  templateUrl: './animals.html',
  styleUrl: './animals.css',
})
export class Animals {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private animalService: AnimalService,
    private authService: AuthService,
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      species: ['', Validators.required],
      breedId: [null],
      gender: ['', Validators.required],
      birthDate: [''],
      available: [true, Validators.required],
    });
  }

  /**
   * Faz o registo de um novo animal a partir
   * dos dados inseridos no formulário
   */
  async register() {
    try {
      const user = this.authService.getCurrentUser();

      if (!user) {
        throw new Error('Utilizador não autenticado');
      }

      // Exemplo de request
      // const request = {
      //   name: 'Rex',
      //   species: 'Dog',
      //   breedId: 'e9a7cdb8-7d06-4246-a9d9-3c5c471270e1',
      //   gender: 'male',
      //   birthDate: '2022-03-15',
      //   available: true,
      //   organizationId: user.organizationId,
      // };

      const request = {...this.form.value,
        organizationId: user.organizationId};

      const animal = await this.animalService.registerAnimal(request);
      console.log('Animal criado:', animal);
    } catch (error) {
      console.error('Erro:', error);
    }
  }

}
