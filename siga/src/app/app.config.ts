import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { AuthService } from './services/auth/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),

    // Verifica se o utilizador já possui autenticação
    provideAppInitializer(() => {
      const authService: AuthService = inject(AuthService);
      return authService.loadUserFromSession();
    })
  ]
};
