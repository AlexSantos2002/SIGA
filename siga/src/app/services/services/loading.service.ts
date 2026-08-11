import { Injectable, signal } from '@angular/core';

/**
 * Serviço responsável por emitir sinais de carregamento
 * para efeitos visuais na barra de navegação
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  readonly isLoading = signal(false);

  private pendingOperations = 0;

  start(): void {
    this.pendingOperations += 1;
    this.isLoading.set(true);
  }

  stop(): void {
    this.pendingOperations = Math.max(0, this.pendingOperations - 1);
    this.isLoading.set(this.pendingOperations > 0);
  }

  async track<T>(operation: Promise<T>): Promise<T> {
    this.start();

    try {
      return await operation;
    } finally {
      this.stop();
    }
  }
}
