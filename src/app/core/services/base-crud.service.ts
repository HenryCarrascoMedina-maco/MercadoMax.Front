import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, QueryParams } from './api.service';
import { PagedResponse } from '../models/api-response.model';
import { PaginationRequest } from '../models/pagination.model';

/**
 * Servicio CRUD genérico para módulos estándar de MercadoMAX. Se extiende por entidad
 * indicando `baseUrl` (URL del microservicio) y `resource` (ruta del recurso).
 * Hereda list/getAll/getById/create/update/delete/toggleStatus contra los envoltorios
 * estándar del backend.
 *
 * Diferencias respecto al ERP Template (adaptaciones de la Fase 0):
 *  - Soporta multi-URL por microservicio (baseUrl por servicio).
 *  - Incluye `toggleStatus` (la convención de MercadoMAX) y `getAll` (listados no paginados).
 *  - La paginación usa la forma plana `PagedResponse<T>`.
 *
 * @typeParam TDto       Modelo de lectura devuelto por la API.
 * @typeParam TCreateDto Payload de creación.
 * @typeParam TUpdateDto Payload de actualización.
 * @typeParam TKey       Tipo del identificador (por defecto number en MercadoMAX).
 */
export abstract class BaseCrudService<
  TDto,
  TCreateDto = Partial<TDto>,
  TUpdateDto = Partial<TDto>,
  TKey = number,
> {
  protected readonly api = inject(ApiService);

  /** URL base del microservicio, ej. environment.maestrosApiUrl. */
  protected abstract readonly baseUrl: string;

  /** Ruta del recurso relativa a baseUrl, ej. `product-categories`. */
  protected abstract readonly resource: string;

  /** URL completa del recurso. */
  protected get endpoint(): string {
    return `${this.baseUrl}/${this.resource}`;
  }

  /** Listado paginado (paginación servidor). */
  list(request: PaginationRequest, filters?: QueryParams): Observable<PagedResponse<TDto>> {
    return this.api.getPaged<TDto>(this.endpoint, request, filters);
  }

  /** Listado completo no paginado (típico de catálogos maestros). */
  getAll(filters?: QueryParams): Observable<TDto[] | null> {
    return this.api.get<TDto[]>(this.endpoint, { params: filters });
  }

  getById(id: TKey): Observable<TDto | null> {
    return this.api.get<TDto>(`${this.endpoint}/${id}`);
  }

  create(payload: TCreateDto): Observable<TDto | null> {
    return this.api.post<TDto>(this.endpoint, payload);
  }

  update(id: TKey, payload: TUpdateDto): Observable<TDto | null> {
    return this.api.put<TDto>(`${this.endpoint}/${id}`, payload);
  }

  delete(id: TKey): Observable<unknown> {
    return this.api.delete(`${this.endpoint}/${id}`);
  }

  /** Activa/desactiva (PATCH /{id}/toggle-status), convención de MercadoMAX. */
  toggleStatus(id: TKey): Observable<unknown> {
    return this.api.patch(`${this.endpoint}/${id}/toggle-status`, {});
  }
}
