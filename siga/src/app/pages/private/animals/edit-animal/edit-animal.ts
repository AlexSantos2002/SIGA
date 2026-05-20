import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { AnimalService } from '../../../../services/animal/animal.service';

@Component({
  selector: 'app-edit-animal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './edit-animal.html',
  styleUrl: './edit-animal.css',
})
export class EditAnimal implements OnInit {
  form: FormGroup;

  animalId = '';

  isLoading = true;
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
    private route: ActivatedRoute,
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
   * Carrega os dados do animal quando a página é aberta.
   */
  async ngOnInit(): Promise<void> {
    this.animalId = this.route.snapshot.paramMap.get('id') || '';

    if (!this.animalId) {
      this.errorMessage = 'Animal não encontrado.';
      this.isLoading = false;
      return;
    }

    await this.loadAnimal();
  }

  /**
   * @description
   * Obtém o animal da base de dados e preenche o formulário.
   */
  private async loadAnimal(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      this.cdr.detectChanges();

      const animal = await this.animalService.getAnimalFromCurrentOrganization(
        this.animalId
      );

      const birthDateParts = this.getBirthDateParts(animal.birthDate);

      this.form.patchValue({
        name: animal.name,
        speciesName: animal.species?.name || '',
        breedName: animal.breed?.name || '',
        gender: animal.gender || '',
        birthDay: birthDateParts.day,
        birthMonth: birthDateParts.month,
        birthYear: birthDateParts.year,
        status: animal.status || 'por_adotar',
      });
    } catch (error: any) {
      console.error('Erro ao carregar animal:', error);

      this.errorMessage =
        error?.message ||
        error?.details ||
        'Não foi possível carregar os dados do animal.';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * @description
   * Separa a data guardada no formato YYYY-MM-DD.
   */
  private getBirthDateParts(birthDate: string | null): {
    day: string;
    month: string;
    year: string;
  } {
    if (!birthDate) {
      return {
        day: '',
        month: '',
        year: '',
      };
    }

    const [year, month, day] = birthDate.split('-');

    return {
      day: String(Number(day)),
      month: String(Number(month)),
      year,
    };
  }

  /**
   * @description
   * Cria a data no formato usado pela Supabase: YYYY-MM-DD.
   */
  private getBirthDate(): string {
    const day = String(this.form.value.birthDay).padStart(2, '0');
    const month = String(this.form.value.birthMonth).padStart(2, '0');
    const year = this.form.value.birthYear;

    return `${year}-${month}-${day}`;
  }

  /**
   * @description
   * Atualiza o animal na organização autenticada.
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

      await this.animalService.updateAnimal(this.animalId, {
        name: this.form.value.name,
        speciesName: this.form.value.speciesName,
        breedName: this.form.value.breedName,
        gender: this.form.value.gender,
        birthDate: this.getBirthDate(),
        status: this.form.value.status,
      });

      await this.router.navigate(['/app/animals']);
    } catch (error: any) {
      console.error('Erro ao atualizar animal:', error);

      this.errorMessage =
        error?.message ||
        error?.details ||
        'Não foi possível atualizar o animal.';
    } finally {
      this.isSubmitting = false;
      this.cdr.detectChanges();
    }
  }
}