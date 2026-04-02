import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  form: FormGroup;

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

  async login() {
    try {
      const user = await this.authService.login(this.form.value);
      console.log('Login efetuado');

      if (user.role == 'admin') {
        console.log('Administrador logado');

        // Redirecionar para pagina de administrador
      } else {
        console.log('Usuario logado');

        // redirecionar para pagina de usuarios
      }
    } catch (err) {
      console.log(err);

      // Adicionar mensagem de erro
    }
  }
}
