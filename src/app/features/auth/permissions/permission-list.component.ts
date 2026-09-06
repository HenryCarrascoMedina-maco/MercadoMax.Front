import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { RoleService } from '../../../core/services/role.service';
import { PermissionResponse } from '../../../core/models/auth.model';
import { TranslocoModule } from '@jsverse/transloco';
import { FlashService } from '../../../core/services/flash.service';

const LIST_PATH = '/permissions';

@Component({
  selector: 'app-permission-list',
  standalone: true,
  imports: [TranslocoModule],
  templateUrl: './permission-list.component.html',
  styleUrl: './permission-list.component.scss'
})
export class PermissionListComponent implements OnInit {
  permissions = signal<PermissionResponse[]>([]);
  loading = signal(false);

  message = signal<{ text: string; type: 'success' | 'error' } | null>(null);


  private readonly router = inject(Router);
  private readonly flash = inject(FlashService);

  constructor(private roleService: RoleService) {}

  ngOnInit(): void {
    const pending = this.flash.consume();
    if (pending) this.showMessage(pending.text, pending.type);
    this.loadPermissions();
  }

  private loadPermissions(): void {
    this.loading.set(true);
    this.roleService.listAllPermissions().subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success) this.permissions.set(res.data);
      },
      error: () => this.loading.set(false)
    });
  }

  /**
   * Totales de la tira de resumen. Salen de lo que la página ya tiene cargado,
   * así que no cuestan ninguna llamada extra.
   */
  readonly stats = computed(() => {
    const all = this.permissions();
    const active = all.filter((p) => p.status === 1).length;
    return {
      total: all.length,
      modules: new Set(all.map((p) => p.module)).size,
      active,
      inactive: all.length - active
    };
  });

  groupedPermissions(): [string, PermissionResponse[]][] {
    const map = new Map<string, PermissionResponse[]>();
    for (const p of [...this.permissions()].sort((a, b) => a.id - b.id)) {
      const group = map.get(p.module) || [];
      group.push(p);
      map.set(p.module, group);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }

  goCreate(): void { this.router.navigate([LIST_PATH, 'nuevo']); }
  goView(perm: PermissionResponse): void { this.router.navigate([LIST_PATH, perm.id]); }
  goEdit(perm: PermissionResponse): void { this.router.navigate([LIST_PATH, perm.id, 'editar']); }

  deletePermission(perm: PermissionResponse): void {
    if (!confirm(`¿Eliminar el permiso "${perm.module}:${perm.action}"?`)) return;
    this.roleService.deletePermission(perm.id).subscribe({
      next: res => {
        if (res.success) {
          this.showMessage(res.message, 'success');
          this.loadPermissions();
        } else {
          this.showMessage(res.message, 'error');
        }
      }
    });
  }

  togglePermissionStatus(perm: PermissionResponse): void {
    this.roleService.toggleStatusPermission(perm.id).subscribe({
      next: res => {
        if (res.success) {
          this.showMessage(res.message, 'success');
          this.loadPermissions();
        } else {
          this.showMessage(res.message, 'error');
        }
      }
    });
  }

  private showMessage(text: string, type: 'success' | 'error'): void {
    this.message.set({ text, type });
    setTimeout(() => this.message.set(null), 4000);
  }
}
