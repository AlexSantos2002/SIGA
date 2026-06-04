import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import {
  ANIMAL_GENDERS,
  ANIMAL_STATUSES,
} from '../../../../constants/form-options';
import { DatePicker } from '../../../../components/date-picker/date-picker';
import { AnimalService } from '../../../../services/animal/animal.service';
import { withTimeout } from '../../../../utils/utils';

@Component({
  selector: 'app-add-animal',
  standalone: true,
  imports: [CommonModule, DatePicker, ReactiveFormsModule, RouterModule],
  templateUrl: './add-animal.html',
  styleUrl: './add-animal.css',
})
export class AddAnimal {
  form: FormGroup;

  isSubmitting = false;
  errorMessage = '';

  readonly statuses = ANIMAL_STATUSES;
  readonly genders = ANIMAL_GENDERS;

  constructor(
    private fb: FormBuilder,
    private animalService: AnimalService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(80)]],
      speciesName: ['', [Validators.required, Validators.maxLength(60)]],
      breedName: ['', [Validators.required, Validators.maxLength(80)]],
      gender: ['', Validators.required],
      birthDate: [null, Validators.required],
      status: ['por_adotar', Validators.required],
    });
  }

  private getBirthDate(): string {
    const birthDate = this.form.value.birthDate;

    if (!birthDate) {
      throw new Error('A data de nascimento nao e valida.');
    }

    return birthDate;
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    try {
      this.isSubmitting = true;
      this.errorMessage = '';
      this.cdr.detectChanges();

      await withTimeout(
        this.animalService.createAnimal({
          name: this.form.value.name.trim(),
          speciesName: this.form.value.speciesName.trim(),
          breedName: this.form.value.breedName.trim(),
          gender: this.form.value.gender,
          birthDate: this.getBirthDate(),
          status: this.form.value.status,
        }),
      );

      await this.router.navigate(['/app/animals']);
    } catch (error: any) {
      console.error('Erro ao adicionar animal:', error);

      this.errorMessage =
        error?.message || error?.details || 'Nao foi possivel adicionar o animal.';
    } finally {
      this.isSubmitting = false;
      this.cdr.detectChanges();
    }
  }
}
