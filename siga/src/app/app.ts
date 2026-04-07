import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';

/**
 * @description
 * Este componente serve como ponto de entrada da aplicação Angular,
 * sendo responsável por renderizar as diferentes páginas através do
 * RouterOutlet tendo em conta as rotas definidas
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit{

  constructor(private authService: AuthService) {
  }

  async ngOnInit() {
    await this.authService.loadUserFromSession();
  }

}
