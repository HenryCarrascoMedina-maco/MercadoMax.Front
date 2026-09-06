import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResponse } from '../models/api-response.model';
import {
  GuideResponse, GuideReadResponse, CreateGuideRequest, UpdateGuideStatusRequest,
  GuideDetailResponse, CreateGuideDetailRequest, UpdateGuideDetailRequest
} from '../models/guide.model';

const BASE = environment.guiasApiUrl;

@Injectable({ providedIn: 'root' })
export class GuideService {
  private url = `${BASE}/Guide`;
  constructor(private http: HttpClient) {}

  list(guideStatus?: string, supplierId?: number, carrierId?: number, pageNumber = 1, pageSize = 10): Observable<PagedResponse<GuideResponse>> {
    let params = new HttpParams().set('pageNumber', pageNumber).set('pageSize', pageSize);
    if (guideStatus) params = params.set('guideStatus', guideStatus);
    if (supplierId) params = params.set('supplierId', supplierId);
    if (carrierId) params = params.set('carrierId', carrierId);
    return this.http.get<PagedResponse<GuideResponse>>(this.url, { params });
  }
  getById(id: number) { return this.http.get<ApiResponse<GuideReadResponse>>(`${this.url}/${id}`); }
  listBySupplier(supplierId: number) { return this.http.get<ApiResponse<GuideResponse[]>>(`${this.url}/by-supplier/${supplierId}`); }
  listByStall(stallId: number) { return this.http.get<ApiResponse<GuideResponse[]>>(`${this.url}/by-stall/${stallId}`); }
  create(req: CreateGuideRequest) { return this.http.post<ApiResponse<{ id: number; guideNumber: string }>>(this.url, req); }
  updateStatus(req: UpdateGuideStatusRequest) { return this.http.put<ApiResponse<string>>(`${this.url}/status`, req); }
  /**
   * Anular es baja lógica: `SP_VOID_GUIDE` deja la guía en estado `Voided`, no
   * la borra. El verbo es DELETE porque así lo expone el controlador
   * (`[HttpDelete("{id}")]`); no existe ninguna ruta `/void/{id}`.
   */
  void(id: number) { return this.http.delete<ApiResponse<string>>(`${this.url}/${id}`); }
}

@Injectable({ providedIn: 'root' })
export class GuideDetailService {
  private url = `${BASE}/GuideDetail`;
  constructor(private http: HttpClient) {}

  listByGuide(guideId: number) { return this.http.get<ApiResponse<GuideDetailResponse[]>>(`${this.url}/by-guide/${guideId}`); }
  create(req: CreateGuideDetailRequest) { return this.http.post<ApiResponse<number>>(this.url, req); }
  update(req: UpdateGuideDetailRequest) { return this.http.put<ApiResponse<string>>(this.url, req); }
  delete(id: number) { return this.http.delete<ApiResponse<string>>(`${this.url}/${id}`); }
}
