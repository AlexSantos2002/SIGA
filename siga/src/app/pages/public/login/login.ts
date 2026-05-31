import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';
import { AuthenticationError } from '../../../error/app-error';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  form: FormGroup;
  errorMessage = "";

  /**
   * @description
   * Inicializa o formulário de login com os campos de email e palavra-passe.
   *
   * @param fb Serviço utilizado para criar formulários reativos.
   * @param authService Serviço responsável pela autenticação do utilizador.
   * @param router Serviço utilizado para navegar entre páginas da aplicação.
   */
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  /**
   * @description
   * Valida o formulário de login e tenta autenticar o utilizador.
   *
   * Se o login for bem-sucedido, redireciona o utilizador para o dashboard.
   * Caso ocorra um erro, apresenta uma mensagem de erro ao utilizador.
   *
   * @returns {Promise<void>} Não retorna qualquer valor.
   */
  async login(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    try {
      this.errorMessage = '';

      const user = await this.authService.login(this.form.value);

      if (user) {
        await this.router.navigate(['/app/dashboard']);
      }

    } catch (err) {
      if (err instanceof AuthenticationError) {
        this.errorMessage = err.message;
      }
      this.cdr.detectChanges();
    }
  }
}
