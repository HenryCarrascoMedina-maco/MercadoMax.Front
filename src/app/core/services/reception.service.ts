import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResponse } from '../models/api-response.model';
import {
  ReceptionListResponse, ReceptionReadResponse, CreateReceptionRequest, UpdateReceptionStatusRequest,
  ReceptionDetailResponse, CreateReceptionDetailRequest, UpdateReceptionDetailRequest,
  ShortageResponse, CreateShortageRequest, UpdateShortageStatusRequest
} from '../models/reception.model';

const BASE = environment.recepcionApiUrl;

@Injectable({ providedIn: 'root' })
export class ReceptionService {
  private url = `${BASE}/Reception`;
  constructor(private http: HttpClient) {}

  list(status?: string, stallId?: number, dateFrom?: string, dateTo?: string, pageNumber = 1, pageSize = 10): Observable<PagedResponse<ReceptionListResponse>> {
    let params = new HttpParams().set('pageNumber', pageNumber).set('pageSize', pageSize);
    if (status) params = params.set('status', status);
    if (stallId) params = params.set('stallId', stallId);
    if (dateFrom) params = params.set('dateFrom', dateFrom);
    if (dateTo) params = params.set('dateTo', dateTo);
    return this.http.get<PagedResponse<ReceptionListResponse>>(this.url, { params });
  }
  getById(id: number) { return this.http.get<ApiResponse<ReceptionReadResponse>>(`${this.url}/${id}`); }
  create(req: CreateReceptionRequest) { return this.http.post<ApiResponse<number>>(this.url, req); }
  updateStatus(req: UpdateReceptionStatusRequest) { return this.http.put<ApiResponse<string>>(`${this.url}/status`, req); }
}

@Injectable({ providedIn: 'root' })
export class ReceptionDetailService {
  private url = `${BASE}/ReceptionDetail`;
  constructor(private http: HttpClient) {}

  listByReception(receptionId: number) { return this.http.get<ApiResponse<ReceptionDetailResponse[]>>(`${this.url}/by-reception/${receptionId}`); }
  create(req: CreateReceptionDetailRequest) { return this.http.post<ApiResponse<number>>(this.url, req); }
  update(req: UpdateReceptionDetailRequest) { return this.http.put<ApiResponse<string>>(this.url, req); }
}

@Injectable({ providedIn: 'root' })
export class ShortageService {
  private url = `${BASE}/Shortage`;
  constructor(private http: HttpClient) {}

  list(claimStatus?: string, receptionId?: number, dateFrom?: string, dateTo?: string, pageNumber = 1, pageSize = 10): Observable<PagedResponse<ShortageResponse>> {
    let params = new HttpParams().set('pageNumber', pageNumber).set('pageSize', pageSize);
    if (claimStatus) params = params.set('claimStatus', claimStatus);
    if (receptionId) params = params.set('receptionId', receptionId);
    if (dateFrom) params = params.set('dateFrom', dateFrom);
    if (dateTo) params = params.set('dateTo', dateTo);
    return this.http.get<PagedResponse<ShortageResponse>>(this.url, { params });
  }
  listByReception(receptionId: number) { return this.http.get<ApiResponse<ShortageResponse[]>>(`${this.url}/by-reception/${receptionId}`); }
  create(req: CreateShortageRequest) { return this.http.post<ApiResponse<number>>(this.url, req); }
  updateStatus(req: UpdateShortageStatusRequest) { return this.http.put<ApiResponse<string>>(`${this.url}/status`, req); }
}
