import { Routes } from '@angular/router';

import { PublicLayout } from './pages/public/public-layout';
import { PrivateLayout } from './pages/private/private-layout';

import { Home } from './pages/public/home/home';
import { Register } from './pages/public/register/register';
import { Organizations } from './pages/public/organizations/organizations';
import { About } from './pages/public/about/about'

export const routes: Routes = [
  {
    path: '',
    component: PublicLayout,
    children: [
      { path: '', component: Home },
      { path: 'register', component: Register },
      { path: 'organizations', component: Organizations },
      { path: 'about', component: About }
    ]
  },
  {
    path: 'app',
    component: PrivateLayout
  },
  {
    path: '**',
    redirectTo: ''
  }
];