import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AnimalService } from '../../../services/animal/animal.service';
import { AuthService } from '../../../services/auth/auth.service';
import { User } from '../../../models/user/user.model';
import { AnimalFilters } from '../../../models/animal/animal-filters';
import { Breed } from '../../../models/breed/breed.model';
import { UpdateAnimalRequest } from '../../../models/animal/update-animal-request';
import { RegisterBreedRequest } from '../../../models/breed/register-breed-request';

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
      // const request = {...this.form.value,
      //   organizationId: this.currentUser.organizationId};

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

      const animal = await this.animalService
        .register(this.currentUser.organizationId, request);
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
        .search(this.currentUser.organizationId, {} as AnimalFilters);
      console.log(animals);

      // TODO: Adicionar animais a lista
    } catch (err) {
      console.log('Erro ao buscar animais');
    }
  }

  async getAnimalById(): Promise<void> {
    // TODO: Obter ID do animal através da página/dropdown
    const animalId = '0631320c-f027-427f-ba4d-45271b5fa97e';

    try {
        const animal = await this.animalService.getById(animalId,
          this.currentUser.organizationId)
      console.log(animal);

        // TODO: Redirecionar para página do animal
    } catch (err) {
      // TODO: Mostrar mensagem de erro
      console.log('Não foi possível encontrar o animal');
    }
  }

  /**
   * Edita um animal
   */
  async update(): Promise<void> {
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

    const request: UpdateAnimalRequest = {
      name: name,
      speciesId: speciesId,
      breedId: breedId,
      gender: gender,
      birthDate: birthDate,
      available: available,
    }

    try {
      // TODO: Mensagem de animal atualizado. Atualizar campos do formulário?
      await this.animalService
        .update(animalId, this.currentUser.organizationId, request);
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

    const request: RegisterBreedRequest = {
      name: name,
      speciesId: speciesId ,
    }

    try {
      await this.animalService
        .registerBreed(this.currentUser.organizationId, request)
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
        const breeds: Breed[] = await this.animalService
          .getAllBreeds(this.currentUser.organizationId);
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
        const breeds: Breed[] = await this.animalService
          .getBreedsBasedOnSpecies(speciesId,
            this.currentUser.organizationId);
      console.log(breeds);
    } catch (err) {
      console.log('Erro ao buscar raças');
    }
  }
}
