import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { NavbarPrivate } from '../../components/navbar-private/navbar-private';

@Component({
  selector: 'app-private-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarPrivate],
  templateUrl: './private-layout.html',
  styleUrl: './private-layout.css',
})
export class PrivateLayout {}