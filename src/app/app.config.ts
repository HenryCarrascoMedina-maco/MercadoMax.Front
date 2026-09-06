import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { correlationIdInterceptor } from './core/interceptors/correlation-id.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { translocoProviders } from './transloco-loader';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // Orden: el request fluye de izquierda a derecha; la respuesta vuelve en orden inverso.
    // authInterceptor va ÚLTIMO (más interno) para ver el 401 primero y ejecutar su
    // refresh-token + retry antes de que errorInterceptor lo procese. No se altera su lógica.
    provideHttpClient(
      withInterceptors([
        correlationIdInterceptor,
        loadingInterceptor,
        errorInterceptor,
        authInterceptor
      ])
    ),
    translocoProviders
  ]
};
