import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AnimalService } from '../../../../services/animal/animal.service';

@Component({
  selector: 'app-add-animal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './add-animal.html',
  styleUrl: './add-animal.css',
})
export class AddAnimal {
  form: FormGroup;

  isSubmitting = false;
  errorMessage = '';

  statuses = [
    { value: 'por_adotar', label: 'Por adotar' },
    { value: 'em_tratamento', label: 'Em tratamento' },
    { value: 'adotado', label: 'Adotado' },
  ];

  genders = [
    { value: 'male', label: 'Macho' },
    { value: 'female', label: 'Fêmea' },
  ];

  days = Array.from({ length: 31 }, (_, index) => index + 1);

  months = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' },
  ];

  years: number[] = [];

  constructor(
    private fb: FormBuilder,
    private animalService: AnimalService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    const currentYear = new Date().getFullYear();

    this.years = Array.from(
      { length: 60 },
      (_, index) => currentYear - index
    );

    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(80)]],
      speciesName: ['', [Validators.required, Validators.maxLength(60)]],
      breedName: ['', [Validators.required, Validators.maxLength(80)]],
      gender: ['', Validators.required],
      birthDay: ['', Validators.required],
      birthMonth: ['', Validators.required],
      birthYear: ['', Validators.required],
      status: ['por_adotar', Validators.required],
    });
  }

  /**
   * @description
   * Impede que o formulário fique preso eternamente ao guardar.
   */
  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs = 10000
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error('Tempo limite ao guardar animal.')),
          timeoutMs
        )
      ),
    ]);
  }

  /**
   * @description
   * Cria uma data no formato aceite pela base de dados: YYYY-MM-DD.
   */
  private getBirthDate(): string {
    const day = String(this.form.value.birthDay).padStart(2, '0');
    const month = String(this.form.value.birthMonth).padStart(2, '0');
    const year = this.form.value.birthYear;

    return `${year}-${month}-${day}`;
  }

  /**
   * @description
   * Regista o animal na organização autenticada.
   */
  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    try {
      this.isSubmitting = true;
      this.errorMessage = '';
      this.cdr.detectChanges();

      await this.withTimeout(
        this.animalService.createAnimal({
          name: this.form.value.name,
          speciesName: this.form.value.speciesName,
          breedName: this.form.value.breedName,
          gender: this.form.value.gender,
          birthDate: this.getBirthDate(),
          status: this.form.value.status,
        })
      );

      await this.router.navigate(['/app/animals']);
    } catch (error: any) {
      console.error('Erro ao adicionar animal:', error);

      this.errorMessage =
        error?.message ||
        error?.details ||
        'Não foi possível adicionar o animal.';
    } finally {
      this.isSubmitting = false;
      this.cdr.detectChanges();
    }
  }
}