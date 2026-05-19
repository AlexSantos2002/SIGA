import { Routes } from '@angular/router';

import { AuthGuard } from './guards/auth.guard';

/**
 * @description
 * Configuração das rotas da aplicação SIGA.
 *
 * Define a navegação entre páginas públicas e privadas,
 * utilizando lazy loading para carregar cada página apenas
 * quando for necessária.
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/public/public-layout').then(m => m.PublicLayout),
    children: [
      /**
       * @description Página inicial da aplicação
       */
      {
        path: '',
        loadComponent: () =>
          import('./pages/public/home/home').then(m => m.Home)
      },

      /**
       * @description Página de registo de organização
       */
      {
        path: 'register',
        loadComponent: () =>
          import('./pages/public/register/register').then(m => m.Register)
      },

      /**
       * @description Página de login
       */
      {
        path: 'login',
        loadComponent: () =>
          import('./pages/public/login/login').then(m => m.Login)
      },

      /**
       * @description Página sobre o projeto SIGA
       */
      {
        path: 'about',
        loadComponent: () =>
          import('./pages/public/about/about').then(m => m.About)
      },

      /**
       * @description Página de perguntas frequentes
       */
      {
        path: 'faq',
        loadComponent: () =>
          import('./pages/public/faq/faq').then(m => m.Faq)
      },

      /**
       * @description Página de contactos
       */
      {
        path: 'contacts',
        loadComponent: () =>
          import('./pages/public/contacts/contacts').then(m => m.Contacts)
      }
    ]
  },

  {
    /**
     * @description
     * Área privada da aplicação.
     *
     * Esta rota é utilizada para funcionalidades internas
     * disponíveis apenas após autenticação.
     */
    path: 'app',
    loadComponent: () =>
      import('./pages/private/private-layout').then(m => m.PrivateLayout),
    canActivate: [AuthGuard],
    children: [
      /**
       * @description
       * Quando o utilizador entra em /app,
       * é redirecionado automaticamente para o dashboard.
       */
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },

      /**
       * @description Página inicial privada após login
       */
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/private/dashboard/dashboard').then(m => m.Dashboard)
      },

      /**
       * @description Página de gestão de animais
       */
      {
        path: 'animals',
        loadComponent: () =>
          import('./pages/private/animals/animals').then(m => m.Animals)
      },

      /**
       * @description Página de gestão de adotantes
       */
      {
        path: 'adopters',
        loadComponent: () =>
          import('./pages/private/adopters/adopters').then(m => m.Adopters)
      },

      /**
       * @description Página de gestão de adoções
       */
      {
        path: 'adoptions',
        loadComponent: () =>
          import('./pages/private/adoptions/adoptions').then(m => m.Adoptions)
      }
    ]
  },

  {
    /**
     * @description
     * Rota para capturar URLs inválidos.
     * Redireciona o utilizador para a página inicial.
     */
    path: '**',
    redirectTo: ''
  }
];