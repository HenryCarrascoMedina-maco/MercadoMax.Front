import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResponse } from '../models/api-response.model';
import {
  ReceptionConfirmationResponse, CreateReceptionConfirmationRequest,
  InventoryResponse, CreateInventoryRequest, UpdateInventoryRequest,
  InventoryMovementResponse, CreateInventoryMovementRequest
} from '../models/merchant.model';

const BASE = environment.comercianteApiUrl;

@Injectable({ providedIn: 'root' })
export class ReceptionConfirmationService {
  private url = `${BASE}/ReceptionConfirmation`;
  constructor(private http: HttpClient) {}

  listByStall(stallId: number, dateFrom?: string, dateTo?: string): Observable<ApiResponse<ReceptionConfirmationResponse[]>> {
    let params = new HttpParams();
    if (dateFrom) params = params.set('dateFrom', dateFrom);
    if (dateTo) params = params.set('dateTo', dateTo);
    return this.http.get<ApiResponse<ReceptionConfirmationResponse[]>>(`${this.url}/by-stall/${stallId}`, { params });
  }
  create(req: CreateReceptionConfirmationRequest) { return this.http.post<ApiResponse<number>>(this.url, req); }
}

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private url = `${BASE}/Inventory`;
  constructor(private http: HttpClient) {}

  list(stallId?: number, productId?: number, lowStock?: boolean): Observable<ApiResponse<InventoryResponse[]>> {
    let params = new HttpParams();
    if (stallId) params = params.set('stallId', stallId);
    if (productId) params = params.set('productId', productId);
    if (lowStock !== undefined) params = params.set('lowStock', lowStock);
    return this.http.get<ApiResponse<InventoryResponse[]>>(this.url, { params });
  }
  getById(id: number) { return this.http.get<ApiResponse<InventoryResponse>>(`${this.url}/${id}`); }
  listByStall(stallId: number) { return this.http.get<ApiResponse<InventoryResponse[]>>(`${this.url}/by-stall/${stallId}`); }
  create(req: CreateInventoryRequest) { return this.http.post<ApiResponse<number>>(this.url, req); }
  update(req: UpdateInventoryRequest) { return this.http.put<ApiResponse<string>>(this.url, req); }
}

@Injectable({ providedIn: 'root' })
export class InventoryMovementService {
  private url = `${BASE}/InventoryMovement`;
  constructor(private http: HttpClient) {}

  listByInventory(inventoryId: number, dateFrom?: string, dateTo?: string, pageNumber = 1, pageSize = 10): Observable<PagedResponse<InventoryMovementResponse>> {
    let params = new HttpParams().set('pageNumber', pageNumber).set('pageSize', pageSize);
    if (dateFrom) params = params.set('dateFrom', dateFrom);
    if (dateTo) params = params.set('dateTo', dateTo);
    return this.http.get<PagedResponse<InventoryMovementResponse>>(`${this.url}/by-inventory/${inventoryId}`, { params });
  }
  create(req: CreateInventoryMovementRequest) { return this.http.post<ApiResponse<number>>(this.url, req); }
}
