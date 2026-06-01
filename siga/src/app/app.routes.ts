import { Routes } from '@angular/router';

import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/public/public-layout').then((m) => m.PublicLayout),
    canActivate: [guestGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/public/home/home').then((m) => m.Home),
      },
      {
        path: 'register',
        loadComponent: () => import('./pages/public/register/register').then((m) => m.Register),
      },
      {
        path: 'login',
        loadComponent: () => import('./pages/public/login/login').then((m) => m.Login),
      },
      {
        path: 'about',
        loadComponent: () => import('./pages/public/about/about').then((m) => m.About),
      },
      {
        path: 'faq',
        loadComponent: () => import('./pages/public/faq/faq').then((m) => m.Faq),
      },
      {
        path: 'contacts',
        loadComponent: () => import('./pages/public/contacts/contacts').then((m) => m.Contacts),
      },
    ],
  },
  {
    path: 'app',
    loadComponent: () => import('./pages/private/private-layout').then((m) => m.PrivateLayout),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/private/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'animals',
        loadComponent: () => import('./pages/private/animals/animals').then((m) => m.Animals),
      },
      {
        path: 'animals/new',
        loadComponent: () =>
          import('./pages/private/animals/add-animal/add-animal').then((m) => m.AddAnimal),
      },
      {
        path: 'animals/:id/edit',
        loadComponent: () =>
          import('./pages/private/animals/edit-animal/edit-animal').then((m) => m.EditAnimal),
      },
      {
        path: 'adopters',
        loadComponent: () => import('./pages/private/adopters/adopters').then((m) => m.Adopters),
      },
      {
        path: 'adopters/new',
        loadComponent: () =>
          import('./pages/private/adopters/add-adopter/add-adopter').then((m) => m.AddAdopter),
      },
      {
        path: 'adopters/:id/edit',
        loadComponent: () =>
          import('./pages/private/adopters/edit-adopter/edit-adopter').then((m) => m.EditAdopter),
      },
      {
        path: 'adoptions',
        loadComponent: () => import('./pages/private/adoptions/adoptions').then((m) => m.Adoptions),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
