import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth/auth.service';
import { supabase } from '../../../../../supabase/supabase';

/**
 * @description
 * Componente responsável pelo login
 *
 * Apresenta um formulário onde o utilizador introduz
 * as credenciais de acesso à plataforma
 *
 * Após o login redireciona para uma página
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  /**
   * @description
   * Formulário utilizado para receber as credenciais do user
   */
  form: FormGroup;

  /**
   * @description
   * Construtor do componente
   * Inicializa o formulário com validações obrigatórias
   *
   * @param fb Serviço FormBuilder para criação do formulário
   * @param authService Responsável pelo login
   */
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  /**
   * @description
   * Realiza o processo de login do utilizador
   *
   * Envia as credenciais para o AuthService e em caso de sucesso, verifica o papel do utilizador
   * para definir o redirecionamento adequado
   *
   * Em caso de erro regista o erro e apresenta uma mensagem ao utilizador
   *
   * @returns {Promise<void>} Promessa resolvida após tentativa de login
   */
  async login(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    try {
      const user = await this.authService.login(this.form.value);

      if (user) {
        console.log('Utilizador logado');

        // Redirecionar para pagina principal
      }

    } catch (err) {
      console.log(err);

      //Mensagem de erro ao utilizador
    }
  }
}
