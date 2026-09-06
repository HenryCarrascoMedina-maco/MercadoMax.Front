import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, map } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { RoleService } from '../../../core/services/role.service';
import { RoleResponse, PermissionResponse } from '../../../core/models/auth.model';
import { CrudFormPageBase } from '../../../shared/base/crud-form-page.base';
import { FormPageComponent } from '../../../shared/components/form-page/form-page.component';
import { unwrapApi } from '../../../shared/utils/api-response.operators';

/**
 * Alta y edición de roles (`/nuevo`, `/:id/editar`), con la matriz de permisos.
 *
 * A página completa la matriz cabe entera: antes vivía dentro de un `modal-lg`
 * con scroll propio.
 */
@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoModule, FormPageComponent],
  templateUrl: './role-form.component.html',
  styleUrl: './role-form.component.scss'
})
export class RoleFormComponent extends CrudFormPageBase<RoleResponse> implements OnInit {
  private readonly roleService = inject(RoleService);
  private readonly fb = inject(FormBuilder);

  protected readonly listPath = '/roles';

  readonly allPermissions = signal<PermissionResponse[]>([]);
  readonly selectedPermissionIds = signal<Set<number>>(new Set());

  ngOnInit(): void {
    this.initPage();
  }

  protected override buildForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(200)]]
    });
  }

  protected override loadLookups(): void {
    this.roleService.listAllPermissions().subscribe((res) => {
      if (res.success) this.allPermissions.set(res.data);
    });
  }

  protected override fetchById(id: number): Observable<RoleResponse | null> {
    return this.roleService.getById(id).pipe(map((res) => (res.success ? res.data : null)));
  }

  protected override toFormValue(row: RoleResponse) {
    return { name: row.name, description: row.description };
  }

  /** Los permisos del rol vienen de su propio endpoint, no del rol. */
  protected override afterRecordLoaded(row: RoleResponse): void {
    this.roleService.getPermissionsByRole(row.id).subscribe((res) => {
      if (res.success) this.selectedPermissionIds.set(new Set(res.data.map((p) => p.id)));
    });
  }

  protected override persist(v: any, current: RoleResponse | null): Observable<unknown> {
    const permissionIds = Array.from(this.selectedPermissionIds());
    return current
      ? unwrapApi(this.roleService.update({
          id: current.id, name: v.name, description: v.description, permissionIds
        }))
      : unwrapApi(this.roleService.create({ name: v.name, description: v.description, permissionIds }));
  }

  pageTitle(): string {
    return this.transloco.translate(this.isEdit() ? 'rolesPage.editTitle' : 'rolesPage.createTitle');
  }

  // ── Matriz de permisos ──────────────────────────────────

  groupedAllPermissions(): [string, PermissionResponse[]][] {
    const map = new Map<string, PermissionResponse[]>();
    for (const p of [...this.allPermissions()].sort((a, b) => a.id - b.id)) {
      const group = map.get(p.module) || [];
      group.push(p);
      map.set(p.module, group);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }

  isPermissionSelected(id: number): boolean {
    return this.selectedPermissionIds().has(id);
  }

  togglePermission(id: number): void {
    const set = new Set(this.selectedPermissionIds());
    if (set.has(id)) set.delete(id);
    else set.add(id);
    this.selectedPermissionIds.set(set);
  }

  toggleModulePermissions(perms: PermissionResponse[]): void {
    const set = new Set(this.selectedPermissionIds());
    const allSelected = perms.every((p) => set.has(p.id));
    for (const p of perms) {
      if (allSelected) set.delete(p.id);
      else set.add(p.id);
    }
    this.selectedPermissionIds.set(set);
  }

  isModuleAllSelected(perms: PermissionResponse[]): boolean {
    return perms.length > 0 && perms.every((p) => this.selectedPermissionIds().has(p.id));
  }
}
