import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorResponse } from '../models/api-response.model';

/**
 * Traduce errores de transporte/backend a mensajes legibles. Entiende la forma
 * estándar `ErrorResponse` / `ValidationErrorResponse` del middleware global.
 */
@Injectable({ providedIn: 'root' })
export class ErrorHandlerService {
  /** Mensaje único legible para cualquier error HTTP. */
  getMessage(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'No se pudo contactar con el servidor. Verifique su conexión.';
    }

    const body = error.error as ApiErrorResponse | undefined;

    const validationMessages = this.getValidationMessages(error);
    if (validationMessages.length > 0) {
      return validationMessages.join(' ');
    }

    if (body?.message) {
      return body.message;
    }

    switch (error.status) {
      case 401:
        return 'Su sesión expiró. Inicie sesión nuevamente.';
      case 403:
        return 'No tiene permisos para realizar esta acción.';
      case 404:
        return 'No se encontró el recurso solicitado.';
      case 409:
        return 'El recurso entra en conflicto con datos existentes.';
      default:
        return 'Ocurrió un error inesperado. Intente nuevamente más tarde.';
    }
  }

  /** Lista plana de mensajes de validación por campo, si los hay. */
  getValidationMessages(error: HttpErrorResponse): string[] {
    const body = error.error as ApiErrorResponse | undefined;
    if (!body?.errors) {
      return [];
    }
    return Object.values(body.errors).flat();
  }

  /** Mapa campo -> mensajes, para enlazar errores de vuelta a un formulario. */
  getFieldErrors(error: HttpErrorResponse): Record<string, string[]> {
    const body = error.error as ApiErrorResponse | undefined;
    return body?.errors ?? {};
  }
}
