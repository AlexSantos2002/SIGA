import { Component } from '@angular/core';
import { Footer } from './components/footer/footer';
import { Navbar } from './components/navbar/navbar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Footer, Navbar],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}