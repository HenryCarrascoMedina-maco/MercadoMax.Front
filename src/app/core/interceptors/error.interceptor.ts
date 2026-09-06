import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ErrorHandlerService } from '../services/error-handler.service';

/**
 * Manejador global de errores HTTP. Normaliza el error a un mensaje legible y lo
 * registra en consola, luego RE-LANZA el error original para que el llamador siga
 * reaccionando.
 *
 * Importante (Fase 0): NO hace logout ni redirección en 401. El refresh-token y el
 * logout siguen siendo responsabilidad del authInterceptor existente (que se coloca
 * como interceptor MÁS INTERNO para ver la respuesta 401 primero). Así no se rompe el
 * flujo de refresh actual. Tampoco muestra toast (MercadoMAX no usa librería UI todavía);
 * el mensaje normalizado queda disponible para que la UI lo consuma cuando se decida.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorHandler = inject(ErrorHandlerService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const message = errorHandler.getMessage(error);
      console.error(`[HTTP ${error.status}] ${req.method} ${req.url} → ${message}`);
      return throwError(() => error);
    }),
  );
};
