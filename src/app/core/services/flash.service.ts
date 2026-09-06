import { Injectable, signal } from '@angular/core';

export interface FlashMessage {
  text: string;
  type: 'success' | 'error';
}

/**
 * Mensaje que sobrevive a una navegación. Lo usan las páginas de formulario para
 * avisar "Guardado correctamente" en el listado al que vuelven tras guardar.
 *
 * No se usa `router.navigate({ state })` porque `history.state` se conserva al
 * recargar (F5) y el aviso reaparecería sin que se haya guardado nada.
 */
@Injectable({ providedIn: 'root' })
export class FlashService {
  private readonly pending = signal<FlashMessage | null>(null);

  set(text: string, type: FlashMessage['type'] = 'success'): void {
    this.pending.set({ text, type });
  }

  /** Devuelve el mensaje pendiente (si hay) y lo consume. */
  consume(): FlashMessage | null {
    const value = this.pending();
    if (value) this.pending.set(null);
    return value;
  }
}
