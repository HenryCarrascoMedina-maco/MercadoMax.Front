import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResponse } from '../models/api-response.model';
import { CreateUserRequest, UpdateUserRequest, UserResponse, AssignRoleRequest, AssignPermissionRequest } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly apiUrl = `${environment.apiUrl}/user`;

  constructor(private http: HttpClient) {}

  list(search?: string, pageNumber = 1, pageSize = 20): Observable<PagedResponse<UserResponse>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);
    if (search) params = params.set('search', search);
    return this.http.get<PagedResponse<UserResponse>>(this.apiUrl, { params });
  }

  getById(id: number): Observable<ApiResponse<UserResponse>> {
    return this.http.get<ApiResponse<UserResponse>>(`${this.apiUrl}/${id}`);
  }

  create(request: CreateUserRequest): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(this.apiUrl, request);
  }

  update(request: UpdateUserRequest): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(this.apiUrl, request);
  }

  delete(id: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.apiUrl}/${id}`);
  }

  toggleStatus(id: number): Observable<ApiResponse<string>> {
    return this.http.patch<ApiResponse<string>>(`${this.apiUrl}/${id}/toggle-status`, {});
  }

  assignRole(request: AssignRoleRequest): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/assign-role`, request);
  }

  removeRole(userId: number, roleId: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.apiUrl}/${userId}/role/${roleId}`);
  }

  assignPermission(request: AssignPermissionRequest): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/assign-permission`, request);
  }

  removePermission(userId: number, permissionId: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.apiUrl}/${userId}/permission/${permissionId}`);
  }

  getDirectPermissionIds(userId: number): Observable<ApiResponse<number[]>> {
    return this.http.get<ApiResponse<number[]>>(`${this.apiUrl}/${userId}/permissions`);
  }

  assignRolePermissions(request: AssignRoleRequest): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/assign-role-permissions`, request);
  }

  revokeSession(userId: number): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/${userId}/revoke-session`, {});
  }
}
