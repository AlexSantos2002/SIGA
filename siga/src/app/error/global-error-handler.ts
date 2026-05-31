import { AuthenticationError } from './app-error';
import { Router } from '@angular/router';
import { ErrorHandler, Injectable } from '@angular/core';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {

  constructor(private router: Router) {}

  handleError(error: any): void {

    // Retorna a página de login caso o usuário não esteja autenticado
    if (error instanceof AuthenticationError) {
      this.router.navigate(['/login']);
      return;
    }

    console.error(error);
  }
}
