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
    } catch (error) {
      console.error('Erro:', error);
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
    } catch (err) {
      console.log(err);
    }
  }

  async getAnimalById(): Promise<void> {
    const animalId = '0631320c-f027-427f-ba4d-45271b5fa97e';

    try {
        const animal = await this.animalService.getById(animalId,
          this.currentUser.organizationId)

      console.log(animal);
    } catch (err) {
      console.log(err);
    }
  }

  /**
   * Edita um animal
   */
  async update(): Promise<void> {
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
      console.log(err);
    }
  }


  /**
   * Torna um animal indisponível
   */
  async makeAnimalUnavailable(): Promise<void> {
    const animalId = 'a170aefa-04e2-4dca-a615-0f98dd871cff';

    try {
        const animal = this.animalService.makeAnimalUnavailable(animalId,
          this.currentUser.organizationId);

      console.log('Animal atualizado');
    } catch (err) {
      console.log(err);
    }

  }


  /**
   * Cria uma raça para uma determinada espécie de animal
   */
  async createBreed(): Promise<void> {
    const name = 'rottweiler';
    const speciesId = 'fd9a35ba-e3fe-423f-851a-02373560f257'; // cão

    const request: RegisterBreedRequest = {
      name: name,
      speciesId: speciesId ,
    }

    try {
      await this.animalService
        .registerBreed(this.currentUser.organizationId, request)

      console.log('Raça criada');
    } catch (err) {
      console.log(err);
    }
  }


  /**
   * Busca todas as raças de animais disponíveis
   */
  async getBreeds(): Promise<void> {
    try {
        const breeds: Breed[] = await this.animalService
          .getAllBreeds(this.currentUser.organizationId);

      console.log(breeds);
    } catch (err) {
      console.log(err);
    }
  }


  /**
   * Busca as raças de uma determinada espécie
   */
  async getBreedsBasedOnSpecies(): Promise<void> {
    const speciesId = 'fd9a35ba-e3fe-423f-851a-02373560f257';

    try {
        const breeds: Breed[] = await this.animalService
          .getBreedsBasedOnSpecies(speciesId,
            this.currentUser.organizationId);

      console.log(breeds);
    } catch (err) {
      console.log(err);
    }
  }
}
