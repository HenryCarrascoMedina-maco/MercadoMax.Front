import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Observable, map } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { RoleService } from '../../../core/services/role.service';
import { RoleResponse, PermissionResponse } from '../../../core/models/auth.model';
import { CrudFormPageBase } from '../../../shared/base/crud-form-page.base';
import { FormPageComponent } from '../../../shared/components/form-page/form-page.component';
import { DetailViewComponent } from '../../../shared/components/detail-view/detail-view.component';
import { DetailItem } from '../../../shared/models/detail-item.model';

/** Ficha de un rol (`/:id`) con los permisos que tiene concedidos. */
@Component({
  selector: 'app-role-detail',
  standalone: true,
  imports: [TranslocoModule, FormPageComponent, DetailViewComponent],
  templateUrl: './role-detail.component.html',
  styleUrl: './role-detail.component.scss'
})
export class RoleDetailComponent extends CrudFormPageBase<RoleResponse> implements OnInit {
  private readonly roleService = inject(RoleService);
  protected readonly listPath = '/roles';

  readonly permissions = signal<PermissionResponse[]>([]);
  readonly loadingPermissions = signal(false);

  readonly items = computed<DetailItem[]>(() => {
    const row = this.record();
    if (!row) return [];
    return [
      { label: 'common.id', value: row.id, type: 'mono' },
      { label: 'common.name', value: row.name },
      { label: 'common.status', value: row.status, type: 'status' },
      { label: 'common.description', value: row.description, span: true }
    ];
  });

  /** Permisos agrupados por módulo, igual que en el listado. */
  groupedPermissions(): [string, PermissionResponse[]][] {
    const map = new Map<string, PermissionResponse[]>();
    for (const p of [...this.permissions()].sort((a, b) => a.id - b.id)) {
      const group = map.get(p.module) || [];
      group.push(p);
      map.set(p.module, group);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }

  ngOnInit(): void {
    this.initPage();
  }

  protected override fetchById(id: number): Observable<RoleResponse | null> {
    return this.roleService.getById(id).pipe(map((res) => (res.success ? res.data : null)));
  }

  protected override afterRecordLoaded(row: RoleResponse): void {
    this.loadingPermissions.set(true);
    this.roleService.getPermissionsByRole(row.id).subscribe({
      next: (res) => {
        this.permissions.set(res.success ? res.data : []);
        this.loadingPermissions.set(false);
      },
      error: () => { this.permissions.set([]); this.loadingPermissions.set(false); }
    });
  }
}
