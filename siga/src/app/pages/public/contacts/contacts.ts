import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

/**
 * @description
 * Componente responsável pela página de contactos
 */
@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contacts.html',
  styleUrl: './contacts.css'
})
export class Contacts {}