import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  RoleResponse, PermissionResponse,
  CreateRoleRequest, UpdateRoleRequest,
  CreatePermissionRequest, UpdatePermissionRequest
} from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly apiUrl = `${environment.apiUrl}/role`;

  constructor(private http: HttpClient) {}

  list(): Observable<ApiResponse<RoleResponse[]>> {
    return this.http.get<ApiResponse<RoleResponse[]>>(this.apiUrl);
  }

  getById(id: number): Observable<ApiResponse<RoleResponse>> {
    return this.http.get<ApiResponse<RoleResponse>>(`${this.apiUrl}/${id}`);
  }

  getPermissionsByRole(roleId: number): Observable<ApiResponse<PermissionResponse[]>> {
    return this.http.get<ApiResponse<PermissionResponse[]>>(`${this.apiUrl}/${roleId}/permissions`);
  }

  listAllPermissions(): Observable<ApiResponse<PermissionResponse[]>> {
    return this.http.get<ApiResponse<PermissionResponse[]>>(`${this.apiUrl}/permissions`);
  }

  create(request: CreateRoleRequest): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(this.apiUrl, request);
  }

  update(request: UpdateRoleRequest): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(this.apiUrl, request);
  }

  delete(id: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.apiUrl}/${id}`);
  }

  createPermission(request: CreatePermissionRequest): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(`${this.apiUrl}/permissions`, request);
  }

  updatePermission(request: UpdatePermissionRequest): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`${this.apiUrl}/permissions`, request);
  }

  deletePermission(id: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.apiUrl}/permissions/${id}`);
  }

  toggleStatusRole(id: number): Observable<ApiResponse<string>> {
    return this.http.patch<ApiResponse<string>>(`${this.apiUrl}/${id}/toggle-status`, {});
  }

  toggleStatusPermission(id: number): Observable<ApiResponse<string>> {
    return this.http.patch<ApiResponse<string>>(`${this.apiUrl}/permissions/${id}/toggle-status`, {});
  }
}
