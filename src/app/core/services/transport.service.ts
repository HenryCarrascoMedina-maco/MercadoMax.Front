import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResponse } from '../models/api-response.model';
import {
  CarrierResponse, CreateCarrierRequest, UpdateCarrierRequest,
  TruckResponse, CreateTruckRequest, UpdateTruckRequest,
  TransportRateResponse, CreateTransportRateRequest, UpdateTransportRateRequest,
  SettlementListResponse, SettlementReadResponse, CreateSettlementRequest,
  UpdateSettlementStatusRequest, CreateSettlementDetailRequest
} from '../models/transport.model';

const BASE = environment.transporteApiUrl;

@Injectable({ providedIn: 'root' })
export class CarrierService {
  private url = `${BASE}/Carrier`;
  constructor(private http: HttpClient) {}

  list(status?: boolean, search?: string): Observable<ApiResponse<CarrierResponse[]>> {
    let params = new HttpParams();
    if (status !== undefined) params = params.set('status', status);
    if (search) params = params.set('search', search);
    return this.http.get<ApiResponse<CarrierResponse[]>>(this.url, { params });
  }
  getById(id: number) { return this.http.get<ApiResponse<CarrierResponse>>(`${this.url}/${id}`); }
  create(req: CreateCarrierRequest) { return this.http.post<ApiResponse<number>>(this.url, req); }
  update(req: UpdateCarrierRequest) { return this.http.put<ApiResponse<string>>(this.url, req); }
  delete(id: number) { return this.http.delete<ApiResponse<string>>(`${this.url}/${id}`); }
  toggleStatus(id: number) { return this.http.patch<ApiResponse<string>>(`${this.url}/${id}/toggle-status`, {}); }
}

@Injectable({ providedIn: 'root' })
export class TruckService {
  private url = `${BASE}/Truck`;
  constructor(private http: HttpClient) {}

  list(status?: boolean, carrierId?: number, search?: string): Observable<ApiResponse<TruckResponse[]>> {
    let params = new HttpParams();
    if (status !== undefined) params = params.set('status', status);
    if (carrierId) params = params.set('carrierId', carrierId);
    if (search) params = params.set('search', search);
    return this.http.get<ApiResponse<TruckResponse[]>>(this.url, { params });
  }
  getById(id: number) { return this.http.get<ApiResponse<TruckResponse>>(`${this.url}/${id}`); }
  listByCarrier(carrierId: number) { return this.http.get<ApiResponse<TruckResponse[]>>(`${this.url}/by-carrier/${carrierId}`); }
  create(req: CreateTruckRequest) { return this.http.post<ApiResponse<number>>(this.url, req); }
  update(req: UpdateTruckRequest) { return this.http.put<ApiResponse<string>>(this.url, req); }
  delete(id: number) { return this.http.delete<ApiResponse<string>>(`${this.url}/${id}`); }
  toggleStatus(id: number) { return this.http.patch<ApiResponse<string>>(`${this.url}/${id}/toggle-status`, {}); }
}

@Injectable({ providedIn: 'root' })
export class TransportRateService {
  private url = `${BASE}/TransportRate`;
  constructor(private http: HttpClient) {}

  list(status?: boolean, carrierId?: number, logisticUnitId?: number): Observable<ApiResponse<TransportRateResponse[]>> {
    let params = new HttpParams();
    if (status !== undefined) params = params.set('status', status);
    if (carrierId) params = params.set('carrierId', carrierId);
    if (logisticUnitId) params = params.set('logisticUnitId', logisticUnitId);
    return this.http.get<ApiResponse<TransportRateResponse[]>>(this.url, { params });
  }
  getById(id: number) { return this.http.get<ApiResponse<TransportRateResponse>>(`${this.url}/${id}`); }
  listByCarrier(carrierId: number) { return this.http.get<ApiResponse<TransportRateResponse[]>>(`${this.url}/by-carrier/${carrierId}`); }
  create(req: CreateTransportRateRequest) { return this.http.post<ApiResponse<number>>(this.url, req); }
  update(req: UpdateTransportRateRequest) { return this.http.put<ApiResponse<string>>(this.url, req); }
  delete(id: number) { return this.http.delete<ApiResponse<string>>(`${this.url}/${id}`); }
  toggleStatus(id: number) { return this.http.patch<ApiResponse<string>>(`${this.url}/${id}/toggle-status`, {}); }
}

@Injectable({ providedIn: 'root' })
export class SettlementService {
  private url = `${BASE}/Settlement`;
  constructor(private http: HttpClient) {}

  list(status?: string, carrierId?: number, dateFrom?: string, dateTo?: string, pageNumber = 1, pageSize = 10): Observable<PagedResponse<SettlementListResponse>> {
    let params = new HttpParams().set('pageNumber', pageNumber).set('pageSize', pageSize);
    if (status) params = params.set('status', status);
    if (carrierId) params = params.set('carrierId', carrierId);
    if (dateFrom) params = params.set('dateFrom', dateFrom);
    if (dateTo) params = params.set('dateTo', dateTo);
    return this.http.get<PagedResponse<SettlementListResponse>>(this.url, { params });
  }
  getById(id: number) { return this.http.get<ApiResponse<SettlementReadResponse>>(`${this.url}/${id}`); }
  create(req: CreateSettlementRequest) { return this.http.post<ApiResponse<number>>(this.url, req); }
  updateStatus(req: UpdateSettlementStatusRequest) { return this.http.put<ApiResponse<string>>(`${this.url}/status`, req); }
  /**
   * Borra la liquidación y sus líneas. Solo procede si sigue pendiente: el
   * backend rechaza las pagadas, que son registro contable.
   */
  delete(id: number) { return this.http.delete<ApiResponse<string>>(`${this.url}/${id}`); }
  createDetail(req: CreateSettlementDetailRequest) { return this.http.post<ApiResponse<number>>(`${this.url}/detail`, req); }
  deleteDetail(id: number) { return this.http.delete<ApiResponse<string>>(`${this.url}/detail/${id}`); }
}
