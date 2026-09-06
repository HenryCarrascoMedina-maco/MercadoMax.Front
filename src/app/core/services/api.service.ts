import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse, PagedResponse } from '../models/api-response.model';
import { PaginationRequest } from '../models/pagination.model';

/** Bolsa de parámetros de query aceptada por el servicio. */
export type QueryParams = Record<string, string | number | boolean | null | undefined>;

export interface RequestOptions {
  params?: QueryParams;
  context?: HttpContext;
}

/**
 * Servicio HTTP base. Envuelve {@link HttpClient} y desempaqueta los envoltorios
 * `ApiResponse<T>` / `PagedResponse<T>` (forma plana de MercadoMAX).
 *
 * NOTA: recibe URLs ABSOLUTAS. MercadoMAX usa una URL distinta por microservicio
 * (maestrosApiUrl, guiasApiUrl, ...), por lo que el prefijo lo arma cada servicio
 * (ver BaseCrudService), no este ApiService.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  /** GET que desempaqueta un envoltorio `ApiResponse<T>`. */
  get<T>(url: string, options?: RequestOptions): Observable<T | null> {
    return this.http
      .get<ApiResponse<T>>(url, this.httpOptions(options))
      .pipe(map((res) => res.data ?? null));
  }

  /** GET para listados paginados; devuelve el `PagedResponse<T>` completo (plano). */
  getPaged<T>(url: string, request: PaginationRequest, extra?: QueryParams): Observable<PagedResponse<T>> {
    return this.http.get<PagedResponse<T>>(url, {
      params: this.toHttpParams({ ...request, ...extra }),
    });
  }

  post<T>(url: string, body: unknown, options?: RequestOptions): Observable<T | null> {
    return this.http
      .post<ApiResponse<T>>(url, body, this.httpOptions(options))
      .pipe(map((res) => res.data ?? null));
  }

  put<T>(url: string, body: unknown, options?: RequestOptions): Observable<T | null> {
    return this.http
      .put<ApiResponse<T>>(url, body, this.httpOptions(options))
      .pipe(map((res) => res.data ?? null));
  }

  patch<T>(url: string, body: unknown, options?: RequestOptions): Observable<T | null> {
    return this.http
      .patch<ApiResponse<T>>(url, body, this.httpOptions(options))
      .pipe(map((res) => res.data ?? null));
  }

  delete<T>(url: string, options?: RequestOptions): Observable<T | null> {
    return this.http
      .delete<ApiResponse<T>>(url, this.httpOptions(options))
      .pipe(map((res) => res.data ?? null));
  }

  /** Descarga cruda para archivos (exportaciones). */
  download(url: string, params?: QueryParams): Observable<Blob> {
    return this.http.get(url, {
      params: this.toHttpParams(params),
      responseType: 'blob',
    });
  }

  private httpOptions(options?: RequestOptions) {
    return {
      params: this.toHttpParams(options?.params),
      context: options?.context,
    };
  }

  private toHttpParams(params?: QueryParams): HttpParams {
    let httpParams = new HttpParams();
    if (!params) {
      return httpParams;
    }
    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return httpParams;
  }
}
