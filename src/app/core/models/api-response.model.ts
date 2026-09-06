export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  /** Correlation id del request (opcional; lo añade el backend). Aditivo. */
  correlationId?: string | null;
}

export interface PagedResponse<T> {
  success: boolean;
  data: T[];
  totalRecords: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  /** Opcional. Aditivo. */
  message?: string | null;
  correlationId?: string | null;
}

/**
 * Envoltorio de error estándar del middleware global del backend
 * (ErrorResponse / ValidationErrorResponse).
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  statusCode: number;
  errorCode?: string | null;
  correlationId?: string | null;
  detail?: string | null;
  /** Solo en errores de validación: campo -> mensajes. */
  errors?: Record<string, string[]>;
}
