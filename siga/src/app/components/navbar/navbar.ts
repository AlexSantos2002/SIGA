import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

/**
 * @description
 * Componente responsável pela barra de navegação
 */
@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  imports: [RouterModule, CommonModule]
})
export class Navbar {

  /**
   * @description
   * Controla a visibilidade do menu de seleção de idioma
   */
  showLangMenu: boolean = false;

  /**
   * @description
   * Alterna a visibilidade do menu de idiomas
   *
   * @returns {void} Não retorna valor
   */
  toggleLangMenu(): void {
    this.showLangMenu = !this.showLangMenu;
  }

  /**
   * @description
   * Define o idioma selecionado pelo utilizador
   *
   * @param lang Código do idioma
   * @returns {void} Não retorna valor
   */
  changeLang(lang: string): void {
    if (lang === 'pt') {
      window.location.href = '/';
    } else if (lang === 'en') {
      window.location.href = '/en/';
    }

    this.showLangMenu = false;
  }
}