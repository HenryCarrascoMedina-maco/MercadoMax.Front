import { Injectable, computed, signal } from '@angular/core';

/**
 * Estado de carga global mediante contador de referencias: mantiene el indicador
 * visible mientras haya al menos un request en vuelo.
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly activeRequests = signal(0);

  /** true mientras al menos un request rastreado esté en curso. */
  readonly isLoading = computed(() => this.activeRequests() > 0);

  show(): void {
    this.activeRequests.update((count) => count + 1);
  }

  hide(): void {
    this.activeRequests.update((count) => (count > 0 ? count - 1 : 0));
  }

  reset(): void {
    this.activeRequests.set(0);
  }
}
