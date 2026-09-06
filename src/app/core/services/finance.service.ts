import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResponse } from '../models/api-response.model';
import {
  CreateSaleRequest, CreateSaleDetailRequest,
  SaleListResponse, SaleReadResponse,
  CreateAccountPayableRequest, CreatePaymentRequest,
  AccountPayableListResponse, AccountPayableReadResponse,
  AccountStatementResponse,
  GuideLineForPayable, CreateAccountPayableFromGuideRequest
} from '../models/finance.model';

const BASE = environment.finanzasApiUrl;

@Injectable({ providedIn: 'root' })
export class SaleService {
  private url = `${BASE}/Sale`;
  constructor(private http: HttpClient) {}

  list(
    stallId?: number, paymentType?: string, saleStatus?: string,
    dateFrom?: string, dateTo?: string, search?: string,
    pageNumber = 1, pageSize = 10
  ): Observable<PagedResponse<SaleListResponse>> {
    let params = new HttpParams().set('pageNumber', pageNumber).set('pageSize', pageSize);
    if (stallId)      params = params.set('stallId', stallId);
    if (paymentType)  params = params.set('paymentType', paymentType);
    if (saleStatus)   params = params.set('saleStatus', saleStatus);
    if (dateFrom)     params = params.set('dateFrom', dateFrom);
    if (dateTo)       params = params.set('dateTo', dateTo);
    if (search)       params = params.set('search', search);
    return this.http.get<PagedResponse<SaleListResponse>>(this.url, { params });
  }

  getById(id: number): Observable<ApiResponse<SaleReadResponse>> {
    return this.http.get<ApiResponse<SaleReadResponse>>(`${this.url}/${id}`);
  }

  create(req: CreateSaleRequest): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(this.url, req);
  }

  createDetail(req: CreateSaleDetailRequest): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(`${this.url}/detail`, req);
  }

  void(id: number): Observable<ApiResponse<boolean>> {
    return this.http.put<ApiResponse<boolean>>(`${this.url}/${id}/void`, {});
  }
}

@Injectable({ providedIn: 'root' })
export class AccountPayableService {
  private url = `${BASE}/AccountPayable`;
  constructor(private http: HttpClient) {}

  list(
    stallId?: number, supplierId?: number, accountStatus?: string,
    dateFrom?: string, dateTo?: string, search?: string,
    pageNumber = 1, pageSize = 10
  ): Observable<PagedResponse<AccountPayableListResponse>> {
    let params = new HttpParams().set('pageNumber', pageNumber).set('pageSize', pageSize);
    if (stallId)       params = params.set('stallId', stallId);
    if (supplierId)    params = params.set('supplierId', supplierId);
    if (accountStatus) params = params.set('accountStatus', accountStatus);
    if (dateFrom)      params = params.set('dateFrom', dateFrom);
    if (dateTo)        params = params.set('dateTo', dateTo);
    if (search)        params = params.set('search', search);
    return this.http.get<PagedResponse<AccountPayableListResponse>>(this.url, { params });
  }

  getById(id: number): Observable<ApiResponse<AccountPayableReadResponse>> {
    return this.http.get<ApiResponse<AccountPayableReadResponse>>(`${this.url}/${id}`);
  }

  create(req: CreateAccountPayableRequest): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(this.url, req);
  }

  listByStall(stallId: number, accountStatus?: string): Observable<ApiResponse<AccountPayableListResponse[]>> {
    let params = new HttpParams();
    if (accountStatus) params = params.set('accountStatus', accountStatus);
    return this.http.get<ApiResponse<AccountPayableListResponse[]>>(`${this.url}/by-stall/${stallId}`, { params });
  }

  createPayment(req: CreatePaymentRequest): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(`${this.url}/payment`, req);
  }

  /** Líneas que una guía trae a un puesto, para ponerles precio. */
  guideLines(guideId: number, stallId: number): Observable<ApiResponse<GuideLineForPayable[]>> {
    const params = new HttpParams().set('guideId', guideId).set('stallId', stallId);
    return this.http.get<ApiResponse<GuideLineForPayable[]>>(`${this.url}/guide-lines`, { params });
  }

  /** Alta desde la guía. El total lo calcula el backend, no se envía. */
  createFromGuide(req: CreateAccountPayableFromGuideRequest): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(`${this.url}/from-guide`, req);
  }
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private url = `${BASE}/Report`;
  constructor(private http: HttpClient) {}

  getAccountStatement(stallId: number, dateFrom?: string, dateTo?: string): Observable<ApiResponse<AccountStatementResponse>> {
    let params = new HttpParams();
    if (dateFrom) params = params.set('dateFrom', dateFrom);
    if (dateTo)   params = params.set('dateTo', dateTo);
    return this.http.get<ApiResponse<AccountStatementResponse>>(`${this.url}/account-statement/${stallId}`, { params });
  }
}
