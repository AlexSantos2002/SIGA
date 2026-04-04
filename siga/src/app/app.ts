import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

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
export class App {
}