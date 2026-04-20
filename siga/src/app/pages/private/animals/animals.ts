import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AnimalService } from '../../../services/animal.service';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/User';
import { AnimalFilters } from '../../../models/animal/AnimalFilters';

@Component({
  selector: 'app-animals',
  imports: [],
  templateUrl: './animals.html',
  styleUrl: './animals.css',
})
export class Animals implements OnInit {

  // Formulário para criação de animais
  form: FormGroup;

  // TODO: Implementar lista de animais para visualização

  // Utilizador atual
  private currentUser!: User;

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
   * Inicializa o utilizador atual para
   * efetuar requests
   */
  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser() as User;
  }

  /**
   * Faz o registo de um novo animal a partir
   * dos dados inseridos no formulário
   */
  async register() {
    try {
      // Exemplo de request
      const request = {
        name: 'King',
        species: '31f246ce-d30e-4c31-a536-87730b5fb263',
        breedId: 'e4cbc727-9bdb-476f-8434-ec89dc5c6c5a',
        gender: 'male',
        birthDate: '2020-03-18',
        available: false,
        organizationId: this.currentUser.organizationId,
      };

      // const request = {...this.form.value,
      //   organizationId: this.currentUser.organizationId};

      const animal = await this.animalService.registerAnimal(request);
      console.log('Animal criado:', animal);

      // TODO: Implementar mensagem de animal criado

    } catch (error) {
      console.error('Erro:', error);
    }
  }


  /**
   * Retorna uma lista com todos os animais
   */
  async fetchAllAnimals() {
    try {
      const animals = await this.animalService
        .searchAnimals({organizationId: this.currentUser.organizationId, available: false} as AnimalFilters);
      console.log(animals);
    } catch (err) {}
  }



}
