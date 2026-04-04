import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

/**
 * @description
 * Componente responsável pela barra de navegação
 * 
 * Este componente é utilizado nas páginas públicas e permite a navegação entre diferentes secções do site através do Angular Router
 */
@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  imports: [RouterModule]
})
export class Navbar {}