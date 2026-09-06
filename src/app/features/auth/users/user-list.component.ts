import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { RoleService } from '../../../core/services/role.service';
import { UserResponse, CreateUserRequest, UpdateUserRequest, RoleResponse, PermissionResponse } from '../../../core/models/auth.model';
import { TranslocoModule } from '@jsverse/transloco';
import { FlashService } from '../../../core/services/flash.service';
import { RoleNamePipe } from '../../../shared/pipes/role-name.pipe';

const LIST_PATH = '/users';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [TranslocoModule, RoleNamePipe],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss'
})
export class UserListComponent implements OnInit {
  users = signal<UserResponse[]>([]);
  totalPages = signal(0);
  currentPage = signal(1);
  search = signal('');
  loading = signal(false);
  message = signal<{ text: string; type: 'success' | 'error' } | null>(null);

  private readonly router = inject(Router);
  private readonly flash = inject(FlashService);

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    const pending = this.flash.consume();
    if (pending) this.showMessage(pending.text, pending.type);
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.userService.list(this.search(), this.currentPage()).subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success) {
          this.users.set(res.data);
          this.totalPages.set(res.totalPages);
        }
      },
      error: () => this.loading.set(false)
    });
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.search.set(value);
    this.currentPage.set(1);
    this.loadUsers();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadUsers();
  }

  goCreate(): void { this.router.navigate([LIST_PATH, 'nuevo']); }
  goView(user: UserResponse): void { this.router.navigate([LIST_PATH, user.id]); }
  goEdit(user: UserResponse): void { this.router.navigate([LIST_PATH, user.id, 'editar']); }

  deleteUser(user: UserResponse): void {
    if (!confirm(`¿Eliminar a ${user.firstName} ${user.lastName}?`)) return;
    this.userService.delete(user.id).subscribe({
      next: res => {
        this.showMessage(res.message, res.success ? 'success' : 'error');
        if (res.success) this.loadUsers();
      },
      error: err => this.showMessage(err.error?.message ?? 'Error al eliminar', 'error')
    });
  }

  toggleStatus(user: UserResponse): void {
    this.userService.toggleStatus(user.id).subscribe({
      next: res => {
        this.showMessage(res.message, res.success ? 'success' : 'error');
        if (res.success) this.loadUsers();
      },
      error: err => this.showMessage(err.error?.message ?? 'Error', 'error')
    });
  }

  private showMessage(text: string, type: 'success' | 'error'): void {
    this.message.set({ text, type });
    setTimeout(() => this.message.set(null), 4000);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }
}
