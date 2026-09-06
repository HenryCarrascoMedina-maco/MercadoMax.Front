import { Component, OnInit, computed, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { RoleService } from '../../../core/services/role.service';
import { PermissionResponse } from '../../../core/models/auth.model';
import { CrudFormPageBase } from '../../../shared/base/crud-form-page.base';
import { FormPageComponent } from '../../../shared/components/form-page/form-page.component';
import { DetailViewComponent } from '../../../shared/components/detail-view/detail-view.component';
import { DetailItem } from '../../../shared/models/detail-item.model';

/** Ficha de un permiso (`/:id`). */
@Component({
  selector: 'app-permission-detail',
  standalone: true,
  imports: [TranslocoModule, FormPageComponent, DetailViewComponent],
  templateUrl: './permission-detail.component.html',
  styleUrl: './permission-detail.component.scss'
})
export class PermissionDetailComponent extends CrudFormPageBase<PermissionResponse> implements OnInit {
  private readonly roleService = inject(RoleService);
  protected readonly listPath = '/permissions';

  readonly items = computed<DetailItem[]>(() => {
    const row = this.record();
    if (!row) return [];
    return [
      { label: 'common.id', value: row.id, type: 'mono' },
      { label: 'permissionsPage.module', value: row.module },
      { label: 'permissionsPage.action', value: row.action },
      { label: 'common.status', value: row.status, type: 'status' },
      { label: 'common.description', value: row.description, span: true }
    ];
  });

  /** Clave completa "Modulo:Accion", que es como se usa en los guards. */
  readonly fullKey = computed(() => {
    const row = this.record();
    return row ? `${row.module}:${row.action}` : '';
  });

  ngOnInit(): void {
    this.initPage();
  }

  protected override fetchById(id: number): Observable<PermissionResponse | null> {
    return this.roleService.listAllPermissions().pipe(
      map((res) => (res.success ? res.data.find((p) => p.id === id) ?? null : null))
    );
  }
}
