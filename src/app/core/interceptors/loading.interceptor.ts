import { HttpContextToken, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';

/** Poner este token de contexto en `true` para excluir un request del indicador global. */
export const SKIP_LOADING = new HttpContextToken<boolean>(() => false);

/**
 * Maneja el indicador de carga global: incrementa el contador al iniciar y lo
 * decrementa al finalizar. El polling de fondo puede excluirse con {@link SKIP_LOADING}.
 */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(SKIP_LOADING)) {
    return next(req);
  }

  const loading = inject(LoadingService);
  loading.show();

  return next(req).pipe(finalize(() => loading.hide()));
};
