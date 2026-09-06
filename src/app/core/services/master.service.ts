import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  ProductCategoryResponse, CreateProductCategoryRequest, UpdateProductCategoryRequest,
  ProductResponse, CreateProductRequest, UpdateProductRequest,
  ProductSizeResponse, CreateProductSizeRequest, UpdateProductSizeRequest,
  BrandResponse, CreateBrandRequest, UpdateBrandRequest,
  SupplierResponse, CreateSupplierRequest, UpdateSupplierRequest,
  LogisticUnitResponse, CreateLogisticUnitRequest, UpdateLogisticUnitRequest,
  PavilionResponse, CreatePavilionRequest, UpdatePavilionRequest,
  StallResponse, CreateStallRequest, UpdateStallRequest
} from '../models/master.model';
import { BaseCrudService } from './base-crud.service';

const BASE = environment.maestrosApiUrl;

// ── Product Category (migrado a BaseCrudService — piloto Fase 1) ──
@Injectable({ providedIn: 'root' })
export class ProductCategoryService
  extends BaseCrudService<ProductCategoryResponse, CreateProductCategoryRequest, UpdateProductCategoryRequest, number> {
  protected readonly baseUrl = BASE;
  protected readonly resource = 'ProductCategory';
}

// ── Product ─────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class ProductService {
  private url = `${BASE}/Product`;
  constructor(private http: HttpClient) {}

  list(status?: boolean, categoryId?: number, search?: string): Observable<ApiResponse<ProductResponse[]>> {
    let params = new HttpParams();
    if (status !== undefined) params = params.set('status', status);
    if (categoryId) params = params.set('categoryId', categoryId);
    if (search) params = params.set('search', search);
    return this.http.get<ApiResponse<ProductResponse[]>>(this.url, { params });
  }
  getById(id: number) { return this.http.get<ApiResponse<ProductResponse>>(`${this.url}/${id}`); }
  create(req: CreateProductRequest) { return this.http.post<ApiResponse<number>>(this.url, req); }
  update(req: UpdateProductRequest) { return this.http.put<ApiResponse<string>>(this.url, req); }
  delete(id: number) { return this.http.delete<ApiResponse<string>>(`${this.url}/${id}`); }
  toggleStatus(id: number) { return this.http.patch<ApiResponse<string>>(`${this.url}/${id}/toggle-status`, {}); }
}

// ── Product Size ────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class ProductSizeService {
  private url = `${BASE}/ProductSize`;
  constructor(private http: HttpClient) {}

  list(status?: boolean, productId?: number): Observable<ApiResponse<ProductSizeResponse[]>> {
    let params = new HttpParams();
    if (status !== undefined) params = params.set('status', status);
    if (productId) params = params.set('productId', productId);
    return this.http.get<ApiResponse<ProductSizeResponse[]>>(this.url, { params });
  }
  getById(id: number) { return this.http.get<ApiResponse<ProductSizeResponse>>(`${this.url}/${id}`); }
  create(req: CreateProductSizeRequest) { return this.http.post<ApiResponse<number>>(this.url, req); }
  update(req: UpdateProductSizeRequest) { return this.http.put<ApiResponse<string>>(this.url, req); }
  delete(id: number) { return this.http.delete<ApiResponse<string>>(`${this.url}/${id}`); }
  toggleStatus(id: number) { return this.http.patch<ApiResponse<string>>(`${this.url}/${id}/toggle-status`, {}); }
}

// ── Brand ───────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class BrandService {
  private url = `${BASE}/Brand`;
  constructor(private http: HttpClient) {}

  list(status?: boolean, supplierId?: number, productId?: number, search?: string): Observable<ApiResponse<BrandResponse[]>> {
    let params = new HttpParams();
    if (status !== undefined) params = params.set('status', status);
    if (supplierId) params = params.set('supplierId', supplierId);
    if (productId) params = params.set('productId', productId);
    if (search) params = params.set('search', search);
    return this.http.get<ApiResponse<BrandResponse[]>>(this.url, { params });
  }
  listBySupplier(supplierId: number) { return this.http.get<ApiResponse<BrandResponse[]>>(`${this.url}/by-supplier/${supplierId}`); }
  getById(id: number) { return this.http.get<ApiResponse<BrandResponse>>(`${this.url}/${id}`); }
  create(req: CreateBrandRequest) { return this.http.post<ApiResponse<number>>(this.url, req); }
  update(req: UpdateBrandRequest) { return this.http.put<ApiResponse<string>>(this.url, req); }
  delete(id: number) { return this.http.delete<ApiResponse<string>>(`${this.url}/${id}`); }
  toggleStatus(id: number) { return this.http.patch<ApiResponse<string>>(`${this.url}/${id}/toggle-status`, {}); }
}

// ── Supplier ────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class SupplierService {
  private url = `${BASE}/Supplier`;
  constructor(private http: HttpClient) {}

  list(status?: boolean, search?: string): Observable<ApiResponse<SupplierResponse[]>> {
    let params = new HttpParams();
    if (status !== undefined) params = params.set('status', status);
    if (search) params = params.set('search', search);
    return this.http.get<ApiResponse<SupplierResponse[]>>(this.url, { params });
  }
  getById(id: number) { return this.http.get<ApiResponse<SupplierResponse>>(`${this.url}/${id}`); }
  create(req: CreateSupplierRequest) { return this.http.post<ApiResponse<number>>(this.url, req); }
  update(req: UpdateSupplierRequest) { return this.http.put<ApiResponse<string>>(this.url, req); }
  delete(id: number) { return this.http.delete<ApiResponse<string>>(`${this.url}/${id}`); }
  toggleStatus(id: number) { return this.http.patch<ApiResponse<string>>(`${this.url}/${id}/toggle-status`, {}); }
}

// ── Logistic Unit ───────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class LogisticUnitService {
  private url = `${BASE}/LogisticUnit`;
  constructor(private http: HttpClient) {}

  list(status?: boolean): Observable<ApiResponse<LogisticUnitResponse[]>> {
    let params = new HttpParams();
    if (status !== undefined) params = params.set('status', status);
    return this.http.get<ApiResponse<LogisticUnitResponse[]>>(this.url, { params });
  }
  getById(id: number) { return this.http.get<ApiResponse<LogisticUnitResponse>>(`${this.url}/${id}`); }
  create(req: CreateLogisticUnitRequest) { return this.http.post<ApiResponse<number>>(this.url, req); }
  update(req: UpdateLogisticUnitRequest) { return this.http.put<ApiResponse<string>>(this.url, req); }
  delete(id: number) { return this.http.delete<ApiResponse<string>>(`${this.url}/${id}`); }
  toggleStatus(id: number) { return this.http.patch<ApiResponse<string>>(`${this.url}/${id}/toggle-status`, {}); }
}

// ── Pavilion ────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class PavilionService {
  private url = `${BASE}/Pavilion`;
  constructor(private http: HttpClient) {}

  list(status?: boolean, search?: string): Observable<ApiResponse<PavilionResponse[]>> {
    let params = new HttpParams();
    if (status !== undefined) params = params.set('status', status);
    if (search) params = params.set('search', search);
    return this.http.get<ApiResponse<PavilionResponse[]>>(this.url, { params });
  }
  getById(id: number) { return this.http.get<ApiResponse<PavilionResponse>>(`${this.url}/${id}`); }
  create(req: CreatePavilionRequest) { return this.http.post<ApiResponse<number>>(this.url, req); }
  update(req: UpdatePavilionRequest) { return this.http.put<ApiResponse<string>>(this.url, req); }
  delete(id: number) { return this.http.delete<ApiResponse<string>>(`${this.url}/${id}`); }
  toggleStatus(id: number) { return this.http.patch<ApiResponse<string>>(`${this.url}/${id}/toggle-status`, {}); }
}

// ── Stall ───────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class StallService {
  private url = `${BASE}/Stall`;
  constructor(private http: HttpClient) {}

  list(status?: boolean, pavilionId?: number, search?: string): Observable<ApiResponse<StallResponse[]>> {
    let params = new HttpParams();
    if (status !== undefined) params = params.set('status', status);
    if (pavilionId) params = params.set('pavilionId', pavilionId);
    if (search) params = params.set('search', search);
    return this.http.get<ApiResponse<StallResponse[]>>(this.url, { params });
  }
  listByPavilion(pavilionId: number) { return this.http.get<ApiResponse<StallResponse[]>>(`${this.url}/by-pavilion/${pavilionId}`); }
  getById(id: number) { return this.http.get<ApiResponse<StallResponse>>(`${this.url}/${id}`); }
  create(req: CreateStallRequest) { return this.http.post<ApiResponse<number>>(this.url, req); }
  update(req: UpdateStallRequest) { return this.http.put<ApiResponse<string>>(this.url, req); }
  delete(id: number) { return this.http.delete<ApiResponse<string>>(`${this.url}/${id}`); }
  toggleStatus(id: number) { return this.http.patch<ApiResponse<string>>(`${this.url}/${id}/toggle-status`, {}); }
}
