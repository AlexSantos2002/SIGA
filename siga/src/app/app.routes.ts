import { Routes } from '@angular/router';

import { PERMISSIONS } from './constants/permissions';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';
import { permissionGuard } from './guards/permission.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/public/public-layout').then((m) => m.PublicLayout),
    children: [
      {
        path: '',
        canActivate: [guestGuard],
        loadComponent: () => import('./pages/public/home/home').then((m) => m.Home),
      },
      {
        path: 'register',
        canActivate: [guestGuard],
        loadComponent: () => import('./pages/public/register/register').then((m) => m.Register),
      },
      {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () => import('./pages/public/login/login').then((m) => m.Login),
      },
      {
        path: 'recover-password',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./pages/public/recover-password/recover-password').then((m) => m.RecoverPassword),
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import('./pages/public/reset-password/reset-password').then((m) => m.ResetPassword),
      },
      {
        path: 'about',
        canActivate: [guestGuard],
        loadComponent: () => import('./pages/public/about/about').then((m) => m.About),
      },
      {
        path: 'faq',
        canActivate: [guestGuard],
        loadComponent: () => import('./pages/public/faq/faq').then((m) => m.Faq),
      },
      {
        path: 'contacts',
        canActivate: [guestGuard],
        loadComponent: () => import('./pages/public/contacts/contacts').then((m) => m.Contacts),
      },
      {
        path: 'privacy-policy',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./pages/public/privacy-policy/privacy-policy').then((m) => m.PrivacyPolicy),
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
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.animalsCreate },
        loadComponent: () =>
          import('./pages/private/animals/add-animal/add-animal').then((m) => m.AddAnimal),
      },
      {
        path: 'animals/:id/edit',
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.animalsUpdate },
        loadComponent: () =>
          import('./pages/private/animals/edit-animal/edit-animal').then((m) => m.EditAnimal),
      },
      {
        path: 'adopters',
        loadComponent: () => import('./pages/private/adopters/adopters').then((m) => m.Adopters),
      },
      {
        path: 'adopters/new',
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.adoptersCreate },
        loadComponent: () =>
          import('./pages/private/adopters/add-adopter/add-adopter').then((m) => m.AddAdopter),
      },
      {
        path: 'adopters/:id/edit',
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.adoptersUpdate },
        loadComponent: () =>
          import('./pages/private/adopters/edit-adopter/edit-adopter').then((m) => m.EditAdopter),
      },
      {
        path: 'adoptions',
        loadComponent: () => import('./pages/private/adoptions/adoptions').then((m) => m.Adoptions),
      },
      {
        path: 'care',
        loadComponent: () => import('./pages/private/care/care').then((m) => m.Care),
      },
      {
        path: 'statistics',
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.statisticsView },
        loadComponent: () =>
          import('./pages/private/statistics/statistics').then((m) => m.Statistics),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/private/settings/settings').then((m) => m.Settings),
      },
      {
        path: 'users',
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.usersView },
        loadComponent: () => import('./pages/private/users/users').then((m) => m.Users),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
