import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * @description
 * Componente responsável pela página home
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {}