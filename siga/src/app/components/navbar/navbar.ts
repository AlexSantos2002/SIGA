import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterModule
} from '@angular/router';

import { LanguageSwitcher } from '../language-switcher/language-switcher';
import { LoadingService } from '../../services/services/loading.service';

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
export class Navbar implements OnInit {

  constructor(private router: Router, public loading: LoadingService) {}

  ngOnInit() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.loading.start();
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.loading.stop();
      }
    });
  }
}
