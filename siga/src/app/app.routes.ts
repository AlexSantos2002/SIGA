import { Routes } from '@angular/router';

import { PublicLayout } from './pages/public/public-layout';
import { PrivateLayout } from './pages/private/private-layout';

import { Home } from './pages/public/home/home';
import { Register } from './pages/public/register/register';
import { About } from './pages/public/about/about';
import { Contacts } from './pages/public/contacts/contacts';
import { Faq } from './pages/public/faq/faq';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayout,
    children: [
      { path: '', component: Home },
      { path: 'register', component: Register },
      { path: 'about', component: About },
      { path: 'faq', component: Faq },
      { path: 'contacts', component: Contacts }
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