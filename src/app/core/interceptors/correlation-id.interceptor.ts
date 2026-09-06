import { HttpInterceptorFn } from '@angular/common/http';

const CORRELATION_ID_HEADER = 'X-Correlation-Id';

/** Genera un id estilo RFC4122 sin dependencias externas. */
function generateCorrelationId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().replace(/-/g, '');
  }
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

/**
 * Adjunta un correlation id único a cada request saliente para correlacionar
 * logs de frontend y backend. El backend devuelve la misma cabecera.
 */
export const correlationIdInterceptor: HttpInterceptorFn = (req, next) => {
  const cloned = req.clone({
    setHeaders: { [CORRELATION_ID_HEADER]: generateCorrelationId() },
  });
  return next(cloned);
};
