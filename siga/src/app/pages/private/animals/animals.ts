import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AnimalService } from '../../../services/animal.service';
import { RegisterAnimalRequest } from '../../../models/RegisterAnimalRequest';

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
  ) {
    this.animalForm = this.fb.group({
      name: ['', Validators.required],
      species: ['', Validators.required],
      breedId: [null],
      gender: ['', Validators.required],
      birthDate: [''],
      status: ['available', Validators.required],
      organizationId: [null, Validators.required],
    });
  }


  async onSubmit() {
    if (this.animalForm.invalid) {
      return;
    }

    try {
      const request = this.animalForm.value;

      const animal = await this.animalService.registerAnimal(request);

      console.log('Animal created:', animal);

      // Reset form after success
      this.animalForm.reset({
        status: 'available',
      });
    } catch (error: any) {
      console.error('Erro: ', error);
    }
  }
}
