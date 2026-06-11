import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  readonly isLoading = signal(false);

  start() { this.isLoading.set(true); }
  stop()  { this.isLoading.set(false); }
}
