import { Injectable, signal } from '@angular/core';

/**
 * Serviço responsável por emitir sinais de carregamento
 * para efeitos visuais na barra de navegação
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  readonly isLoading = signal(false);

  start() { this.isLoading.set(true); }
  stop()  { this.isLoading.set(false); }
}
