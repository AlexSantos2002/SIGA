import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';

/**
 * @description
 * Componente responsável pelo login
 *
 * Formulário de login onde o utilizador introduz
 *
 * Após o login redireciona para uma página
 */
@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {

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
      email: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.login()
  }

  /**
   * @description
   * Realiza o processo de login do utilizador
   *
   * Envia as credenciais para o AuthService e em caso de sucesso, verifica o papel do utilizador
   * para definir o redirecionamento adequado.
   *
   * Em caso de erro regista o erro e  apresenta uma mensagem ao utilizador.
   *
   * @returns {Promise<void>} Promessa resolvida após tentativa de login
   */
  async login(): Promise<void> {
    try {
      // const user = await this.authService.login(this.form.value);
      const user = await this.authService.login({
        email: 'n@n.com',
        password: '123456'
      });


      console.log('Login efetuado');

      /**
       * Verifica o papel do utilizador autenticado
       */
      if (user.role == 'admin') {
        console.log('Administrador logado');

        //Redirecionar para página de administrador
      } else {
        console.log('Utilizador logado');

        //Redirecionar para página de utilizador
      }
    } catch (err) {
      console.log(err);

      // mensagem de erro ao utilizador
    }
  }
}
