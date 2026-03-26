import { Routes } from '@angular/router';
import {Register} from './pages/public/register/register';
import {Organizations} from './pages/public/organizations/organizations';

export const routes: Routes = [
  {path: 'register', component: Register},
  {path: 'organizations', component: Organizations}
];
