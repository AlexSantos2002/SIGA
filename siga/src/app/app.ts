import { Component } from '@angular/core';
import { Footer } from './components/footer/footer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Footer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}