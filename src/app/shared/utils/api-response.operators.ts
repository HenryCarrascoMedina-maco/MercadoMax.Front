import { HttpErrorResponse } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../../core/models/api-response.model';

/**
 * Un `success: false` llega con HTTP 200, así que no dispara el canal de error de
 * RxJS y una página de formulario lo tomaría por guardado correcto. Esto lo
 * convierte en un `HttpErrorResponse` con la forma que espera
 * `ErrorHandlerService`, para que haya un único camino de error.
 */
export function unwrapApi<T>(source: Observable<ApiResponse<T>>): Observable<T> {
  return source.pipe(
    map((res) => {
      if (!res?.success) throw apiError(res?.message);
      return res.data;
    })
  );
}

/** Igual que `unwrapApi`, pero devuelve null en vez de fallar si no hay dato. */
export function unwrapApiOrNull<T>(source: Observable<ApiResponse<T>>): Observable<T | null> {
  return source.pipe(map((res) => (res?.success ? res.data : null)));
}

export function apiError(message?: string): HttpErrorResponse {
  return new HttpErrorResponse({
    status: 400,
    error: { success: false, message: message || 'Error', statusCode: 400 }
  });
}
