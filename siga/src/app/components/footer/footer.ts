import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

/**
 * @description
 * Componente responsável pelo footer
 * 
 * Este componente é apresentado em todas as páginas públicas
 */
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './footer.html',
  styleUrl: './footer.css'
})
export class Footer {

}