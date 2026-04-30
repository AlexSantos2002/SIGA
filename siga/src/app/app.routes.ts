import { Routes } from '@angular/router';

import { PublicLayout } from './pages/public/public-layout';
import { PrivateLayout } from './pages/private/private-layout';

import { Home } from './pages/public/home/home';
import { Register } from './pages/public/register/register';
import { About } from './pages/public/about/about';
import { Contacts } from './pages/public/contacts/contacts';
import { Faq } from './pages/public/faq/faq';
import { Login } from './pages/public/login/login';
import { Animals } from './pages/private/animals/animals';
import { AuthGuard } from './guards/auth.guard';
import { Adopters } from './pages/private/adopters/adopters';
import { Adoptions } from './pages/private/adoptions/adoptions';

/**
 * @description
 * Configuração das rotas da aplicação SIGA.
 *
 * Define a navegação entre páginas públicas (antes do login)
 * e privadas (após o login), utilizando layouts diferentes
 *
 * O PublicLayout é utilizado para páginas acessíveis a todos os utilizadores
 * O PrivateLayout é utilizado para a área interna da aplicação
 *
 * @returns {Routes} Lista de rotas configuradas para a aplicação
 */
export const routes: Routes = [
  {
    path: '',
    component: PublicLayout,
    children: [
      /**
       * @description Página inicial da aplicação
       */
      { path: '', component: Home },

      /**
       * @description Página de registo de organização
       */
      { path: 'register', component: Register },

      /**
       * @description Página de login
       */
      { path: 'login', component: Login },

      /**
       * @description Página sobre o projeto SIGA
       */
      { path: 'about', component: About },

      /**
       * @description Página de perguntas frequentes
       */
      { path: 'faq', component: Faq },

      /**
       * @description Página de contactos
       */
      { path: 'contacts', component: Contacts }
    ]
  },
  {
    /**
     * @description
     * Área privada da aplicação
     *
     * Esta rota será utilizada para funcionalidades internas
     * disponíveis apenas após autenticação.
     */
    path: 'app',
    component: PrivateLayout,
    // canActivate: [AuthGuard], -> permite o acesso a utilizadores autenticados
    children: [
      { path: 'animals',
        component: Animals,
      },
      { path: 'adopters',
        component: Adopters,
      },
      { path: 'adoptions',
        component: Adoptions,
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
