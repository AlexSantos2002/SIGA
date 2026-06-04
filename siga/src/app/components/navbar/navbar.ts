import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { LanguageSwitcher } from '../language-switcher/language-switcher';

/**
 * @description
 * Componente responsável pela barra de navegação
 */
@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  imports: [RouterModule, CommonModule, LanguageSwitcher],
})
export class Navbar {}
