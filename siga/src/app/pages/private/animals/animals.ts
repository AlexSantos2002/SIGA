import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AnimalService } from '../../../services/animal.service';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/User';
import { AnimalFilters } from '../../../models/animal/AnimalFilters';
import { BreedResponse } from '../../../models/animal/BreedResponse';

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
  async register(): Promise<void> {
    try {
      // TODO: Obter dados do animal através de formulário
      const name = 'King'
      const speciesId = 'fd9a35ba-e3fe-423f-851a-02373560f257';
      const breedId = 'e4cbc727-9bdb-476f-8434-ec89dc5c6c5a';
      const gender = 'male'
      const birthDate = '2020-03-18';
      const available = false;

      // Exemplo de request
      const request = {
        name: name,
        speciesId: speciesId,
        breedId: breedId,
        gender: gender,
        birthDate: birthDate,
        available: available,
        organizationId: this.currentUser.organizationId,
      };

      // const request = {...this.form.value,
      //   organizationId: this.currentUser.organizationId};

      const animal = await this.animalService.registerAnimal(request);
      console.log('Animal criado:', animal);

      // TODO: Implementar mensagem de animal criado

    } catch (error) {
      console.error('Erro:', error);

      // TODO: Mostrar mensagem de animal não criado
    }
  }


  /**
   * Retorna uma lista com todos os animais
   */
  async getAllAnimals(): Promise<void> {
    try {
      const animals = await this.animalService
        .searchAnimals({organizationId: this.currentUser.organizationId, available: false} as AnimalFilters);
      console.log(animals);
    } catch (err) {}
  }


  /**
   * Edita um animal
   */
  async editAnimal(): Promise<void> {
    // TODO: Obter dados através de um formulário
    // TODO: Obter id do animal através da página/dropdown

    // Id para testes, remover assim que o ID possa ser obtido de outra forma
    const animalId = 'a170aefa-04e2-4dca-a615-0f98dd871cff';
    const name = 'Molly'
    const speciesId = '31f246ce-d30e-4c31-a536-87730b5fb263';
    const breedId = '4cf11029-c341-4ffe-82e5-4a9dc2e79a1b';
    const gender = 'female'
    const birthDate = '2020-03-18';
    const available = false;

    const request = {
      name: name,
      speciesId: speciesId,
      breedId: breedId,
      gender: gender,
      birthDate: birthDate,
      available: available,
      organizationId: this.currentUser.organizationId
    }

    try {
      // TODO: Mensagem de animal atualizado. Atualizar campos do formulário?
      await this.animalService.editAnimal(animalId, request);
      console.log('Animal atualizado');
    } catch (err) {
      // TODO: implementar mensagem de erro
      console.log('Erro ao atualizar animal');
    }
  }


  /**
   * Cria uma raça para uma determinada espécie de animal
   */
  async createBreed(): Promise<void> {
    // TODO: Obter espécie através de dropdown/página

    const name = 'rottweiler';
    const speciesId = 'fd9a35ba-e3fe-423f-851a-02373560f257'; // cão

    const request = {
      name: name,
      speciesId: speciesId ,
      organizationId: this.currentUser.organizationId
    }

    try {
      await this.animalService.createAnimalBreed(request)
      console.log('raça criada');
      // TODO: Implementar mensagem de raça criada
    } catch (err) {
      // TODO: implementar mensagem de erro
      console.log('Erro ao criar raça', err);
    }
  }


  /**
   * Busca todas as raças de animais disponíveis
   */
  async getBreeds(): Promise<void> {
    try {
      // TODO: Implementar lista/dropdown de raças
        const breeds: BreedResponse[] = await this.animalService
          .getAnimalBreeds(this.currentUser.organizationId);
      console.log(breeds);
    } catch (err) {
      // TODO: Implementar mensagem de erro
      console.log('Erro ao buscar raças');
    }
  }


  /**
   * Busca as raças de uma determinada espécie
   */
  async getBreedsBasedOnSpecies(): Promise<void> {
    // TODO: Obter ID da espécie a partir de dropdown/página

    const speciesId = 'fd9a35ba-e3fe-423f-851a-02373560f257';

    try {
        const breeds: BreedResponse[] = await this.animalService
          .getAnimalBreedsBasedOnSpecies(speciesId,
            this.currentUser.organizationId);
      console.log(breeds);
    } catch (err) {
      console.log('Erro ao buscar raças');
    }
  }
}
