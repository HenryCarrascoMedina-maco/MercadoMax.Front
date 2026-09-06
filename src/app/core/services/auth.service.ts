import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { LoginRequest, LoginResponse, RefreshTokenRequest } from '../models/auth.model';
import { InactivityService } from './inactivity.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly currentUser = signal<LoginResponse | null>(this.loadUser());

  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUser());
  readonly roles = computed(() => this.currentUser()?.roles ?? []);
  readonly fullName = computed(() => this.currentUser()?.fullName ?? '');

  constructor(
    private http: HttpClient,
    private router: Router,
    private inactivityService: InactivityService
  ) {
    if (this.currentUser()) {
      this.inactivityService.start(() => this.logout());
    }
  }

  login(request: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.apiUrl}/login`, request).pipe(
      tap(res => {
        if (res.success) {
          this.saveUser(res.data);
          this.inactivityService.start(() => this.logout());
        }
      })
    );
  }

  refreshToken(): Observable<ApiResponse<LoginResponse>> {
    const user = this.currentUser();
    const request: RefreshTokenRequest = {
      token: user?.token ?? '',
      refreshToken: user?.refreshToken ?? ''
    };
    return this.http.post<ApiResponse<LoginResponse>>(`${this.apiUrl}/refresh-token`, request).pipe(
      tap(res => {
        if (res.success) {
          this.saveUser(res.data);
        }
      })
    );
  }

  logout(): void {
    this.inactivityService.stop();
    sessionStorage.removeItem('currentUser');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.currentUser()?.token ?? null;
  }

  hasRole(role: string): boolean {
    return this.roles().includes(role);
  }

  hasPermission(permission: string): boolean {
    return this.currentUser()?.permissions?.includes(permission) ?? false;
  }

  private saveUser(user: LoginResponse): void {
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUser.set(user);
  }

  private loadUser(): LoginResponse | null {
    const data = sessionStorage.getItem('currentUser');
    if (!data) return null;
    try {
      const user = JSON.parse(data) as LoginResponse;
      if (this.isTokenExpired(user.token)) {
        sessionStorage.removeItem('currentUser');
        return null;
      }
      return user;
    } catch {
      return null;
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
}
