/**
 * Contratos de paginación (lado request) alineados con el backend MercadoMAX.
 * La RESPUESTA sigue siendo la forma plana `PagedResponse<T>` de api-response.model.ts
 * (decisión D.2 de MIGRATION-ANALYSIS.md).
 */
export type SortDirection = 'Ascending' | 'Descending';

export interface Sort {
  sortBy: string;
  sortDirection: SortDirection;
}

/** Parámetros de request para listados paginados/buscables/ordenables. */
export interface PaginationRequest {
  pageNumber: number;
  pageSize: number;
  search?: string | null;
  sortBy?: string | null;
  sortDirection?: SortDirection;
}

export const DEFAULT_PAGINATION_REQUEST: PaginationRequest = {
  pageNumber: 1,
  pageSize: 10,
};
