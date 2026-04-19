import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AnimalService } from '../../../services/animal.service';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/User';

@Component({
  selector: 'app-animals',
  imports: [],
  templateUrl: './animals.html',
  styleUrl: './animals.css',
})
export class Animals implements OnInit {

  // Formulário para criação de animais
  form: FormGroup;

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
      // const request = {
      //   name: 'King',
      //   species: 'Dog',
      //   breedId: 'a9a7cdb8-7d06-4246-a9d9-3c5c471270e0',
      //   gender: 'male',
      //   birthDate: '2020-03-18',
      //   available: false,
      //   organizationId: this.currentUser.organizationId,
      // };

      const request = {...this.form.value,
        organizationId: this.currentUser.organizationId};

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
      await this.animalService.fetchAllAnimals(this.currentUser.organizationId);

      // TODO: Implementar lista de animais para visualização

    } catch (err) {}
  }
}
