import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of, switchMap } from 'rxjs';
import { RoleService } from '../../../core/services/role.service';
import { RoleResponse, PermissionResponse } from '../../../core/models/auth.model';
import { TranslocoModule } from '@jsverse/transloco';
import { FlashService } from '../../../core/services/flash.service';
import { RoleNamePipe } from '../../../shared/pipes/role-name.pipe';

const LIST_PATH = '/roles';

/**
 * Listado de roles como rejilla de tarjetas.
 *
 * Antes era un acordeón que pedía los permisos de un rol al desplegarlo. Ahora
 * cada tarjeta enseña de entrada su cobertura —cuántos permisos de cuántos hay
 * y qué módulos toca—, que es lo que se quiere ver al comparar roles entre sí.
 * A cambio hace falta conocer los permisos de todos ellos al cargar, no de uno
 * en uno: son seis llamadas en paralelo, y el detalle completo vive en la ficha
 * `/roles/:id`.
 */
@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [TranslocoModule, RoleNamePipe],
  templateUrl: './role-list.component.html',
  styleUrl: './role-list.component.scss'
})
export class RoleListComponent implements OnInit {
  readonly roles = signal<RoleResponse[]>([]);
  readonly loading = signal(false);
  readonly message = signal<{ text: string; type: 'success' | 'error' } | null>(null);

  /** Permisos concedidos por cada rol, indexados por id de rol. */
  private readonly permissionsByRole = signal<Map<number, PermissionResponse[]>>(new Map());
  /** Cuántos permisos existen en el sistema: el denominador de la cobertura. */
  readonly totalPermissions = signal(0);

  private readonly router = inject(Router);
  private readonly flash = inject(FlashService);
  private readonly roleService = inject(RoleService);

  ngOnInit(): void {
    const pending = this.flash.consume();
    if (pending) this.showMessage(pending.text, pending.type);
    this.loadRoles();
  }

  private loadRoles(): void {
    this.loading.set(true);

    this.roleService.listAllPermissions().subscribe((res) => {
      if (res.success) this.totalPermissions.set(res.data.length);
    });

    this.roleService.list().pipe(
      switchMap((res) => {
        const list = res.success ? res.data : [];
        this.roles.set(list);
        if (list.length === 0) return of({ list, perms: [] as any[] });
        return forkJoin(list.map((r) => this.roleService.getPermissionsByRole(r.id)))
          .pipe(switchMap((perms) => of({ list, perms })));
      })
    ).subscribe({
      next: ({ list, perms }) => {
        this.loading.set(false);
        const map = new Map<number, PermissionResponse[]>();
        list.forEach((role, i) => {
          const res: any = perms[i];
          map.set(role.id, res?.success ? res.data : []);
        });
        this.permissionsByRole.set(map);
      },
      error: () => this.loading.set(false)
    });
  }

  // ── Cobertura de cada tarjeta ───────────────────────────

  permissionCount(roleId: number): number {
    return this.permissionsByRole().get(roleId)?.length ?? 0;
  }

  /** Módulos distintos que toca el rol, ordenados alfabéticamente. */
  modulesOf(roleId: number): string[] {
    const perms = this.permissionsByRole().get(roleId) ?? [];
    return Array.from(new Set(perms.map((p) => p.module))).sort((a, b) => a.localeCompare(b));
  }

  /** Porcentaje del total, para la barra. 0 si aún no han llegado los permisos. */
  coverage(roleId: number): number {
    const total = this.totalPermissions();
    if (total === 0) return 0;
    return Math.round((this.permissionCount(roleId) / total) * 100);
  }

  // ── Navegación y acciones ───────────────────────────────

  goCreate(): void { this.router.navigate([LIST_PATH, 'nuevo']); }
  goView(role: RoleResponse): void { this.router.navigate([LIST_PATH, role.id]); }
  goEdit(role: RoleResponse): void { this.router.navigate([LIST_PATH, role.id, 'editar']); }

  deleteRole(role: RoleResponse): void {
    if (!confirm(`¿Eliminar el rol "${role.name}"?`)) return;
    this.roleService.delete(role.id).subscribe({
      next: (res) => {
        this.showMessage(res.message, res.success ? 'success' : 'error');
        if (res.success) this.loadRoles();
      }
    });
  }

  toggleRoleStatus(role: RoleResponse): void {
    this.roleService.toggleStatusRole(role.id).subscribe({
      next: (res) => {
        this.showMessage(res.message, res.success ? 'success' : 'error');
        if (res.success) this.loadRoles();
      }
    });
  }

  private showMessage(text: string, type: 'success' | 'error'): void {
    this.message.set({ text, type });
    setTimeout(() => this.message.set(null), 4000);
  }
}
