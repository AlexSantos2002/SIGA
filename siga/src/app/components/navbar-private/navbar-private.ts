import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from '../../services/auth/auth.service';
import { User } from '../../models/user/user.model';

@Component({
  selector: 'app-navbar-private',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar-private.html',
  styleUrl: './navbar-private.css',
})
export class NavbarPrivate implements OnInit, OnDestroy {
  userName = 'Utilizador';
  userEmail = '';
  userRole = '';
  organizationId = '';

  isMenuOpen = false;

  private userSubscription?: Subscription;

  /**
   * @description
   * Inicializa a navbar privada com acesso ao serviço de autenticação
   * e ao router da aplicação.
   *
   * @param authService Serviço responsável pela autenticação do utilizador.
   * @param router Serviço utilizado para navegar entre páginas.
   */
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * @description
   * Carrega e acompanha os dados do utilizador autenticado.
   *
   * @returns {void} Não retorna qualquer valor.
   */
  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();

    if (currentUser) {
      this.setUserData(currentUser);
    }

    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.setUserData(user);
      }
    });
  }

  /**
   * @description
   * Remove a subscrição quando a navbar é destruída.
   *
   * @returns {void} Não retorna qualquer valor.
   */
  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
  }

  /**
   * @description
   * Define os dados do utilizador que serão apresentados na navbar.
   *
   * @param user Utilizador autenticado.
   * @returns {void} Não retorna qualquer valor.
   */
  private setUserData(user: User): void {
    this.userName = user.name || 'Utilizador';
    this.userEmail = user.email || '';
    this.userRole = user.role || '';
    this.organizationId = user.organizationId || '';
  }

  /**
   * @description
   * Abre ou fecha o menu do utilizador.
   *
   * @returns {void} Não retorna qualquer valor.
   */
  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  /**
   * @description
   * Termina a sessão do utilizador e redireciona para a página de login.
   *
   * @returns {Promise<void>} Não retorna qualquer valor.
   */
  async logout(): Promise<void> {
    await this.authService.logout();
    await this.router.navigate(['/login']);
  }
}
