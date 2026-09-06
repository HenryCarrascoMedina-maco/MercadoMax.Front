import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, map, tap } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { RoleService } from '../../../core/services/role.service';
import { PermissionResponse } from '../../../core/models/auth.model';
import { CrudFormPageBase } from '../../../shared/base/crud-form-page.base';
import { FormPageComponent } from '../../../shared/components/form-page/form-page.component';
import { unwrapApi } from '../../../shared/utils/api-response.operators';

/** Valor del desplegable que pide escribir un módulo nuevo. */
const NEW_MODULE = '__new__';

/**
 * Alta y edición de permisos (`/nuevo`, `/:id/editar`).
 *
 * El módulo se elige de los que ya existen porque es la clave que agrupa la
 * matriz de permisos: un "Masters" y un "masters" escritos a mano aparecerían
 * como dos bloques distintos. Para el caso legítimo de un módulo nuevo, el
 * desplegable ofrece escribirlo.
 */
@Component({
  selector: 'app-permission-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoModule, FormPageComponent],
  templateUrl: './permission-form.component.html',
  styleUrl: './permission-form.component.scss'
})
export class PermissionFormComponent extends CrudFormPageBase<PermissionResponse> implements OnInit {
  private readonly roleService = inject(RoleService);
  private readonly fb = inject(FormBuilder);

  protected readonly listPath = '/permissions';

  readonly newModuleValue = NEW_MODULE;

  /** Módulos ya en uso, sacados de los permisos existentes. */
  readonly modules = signal<string[]>([]);

  ngOnInit(): void {
    this.initPage();
  }

  protected override buildForm(): FormGroup {
    return this.fb.group({
      moduleChoice: ['', Validators.required],
      moduleNew: ['', Validators.maxLength(50)],
      action: ['', [Validators.required, Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(200)]]
    });
  }

  protected override loadLookups(): void {
    this.roleService.listAllPermissions().subscribe((res) => {
      if (res.success) this.setModulesFrom(res.data);
    });
  }

  /**
   * El backend no expone `permissions/{id}`: se filtra sobre el listado completo.
   * De paso sirve para tener los módulos aunque esta respuesta llegue antes que la
   * de `loadLookups`.
   */
  protected override fetchById(id: number): Observable<PermissionResponse | null> {
    return this.roleService.listAllPermissions().pipe(
      tap((res) => { if (res.success) this.setModulesFrom(res.data); }),
      map((res) => (res.success ? res.data.find((p) => p.id === id) ?? null : null))
    );
  }

  private setModulesFrom(permissions: PermissionResponse[]): void {
    const unique = Array.from(new Set(permissions.map((p) => p.module).filter(Boolean)));
    this.modules.set(unique.sort((a, b) => a.localeCompare(b)));
  }

  protected override toFormValue(row: PermissionResponse) {
    // Un permiso existente siempre trae un módulo ya en uso, pero si por lo que
    // sea no está en la lista se abre el campo libre con su valor.
    const known = this.modules().includes(row.module);
    return {
      moduleChoice: known ? row.module : NEW_MODULE,
      moduleNew: known ? '' : row.module,
      action: row.action,
      description: row.description
    };
  }

  /** true cuando el desplegable está en "escribir uno nuevo". */
  isNewModule(): boolean {
    return this.form?.get('moduleChoice')?.value === NEW_MODULE;
  }

  /** Exige el nombre solo mientras el campo libre esté a la vista. */
  onModuleChoiceChange(): void {
    const control = this.form?.get('moduleNew');
    if (!control) return;

    if (this.isNewModule()) {
      control.setValidators([Validators.required, Validators.maxLength(50)]);
    } else {
      control.setValidators([Validators.maxLength(50)]);
      control.setValue('');
    }
    control.updateValueAndValidity();
  }

  /**
   * Módulo que se va a guardar. Si lo escrito coincide con uno existente salvo por
   * mayúsculas o espacios, se usa el que ya está: así no se parte la matriz en dos
   * bloques que el usuario ve como el mismo módulo.
   */
  private resolveModule(v: any): string {
    if (v.moduleChoice !== NEW_MODULE) return v.moduleChoice;

    const typed = (v.moduleNew ?? '').trim();
    const existing = this.modules().find((m) => m.toLowerCase() === typed.toLowerCase());
    return existing ?? typed;
  }

  protected override persist(v: any, current: PermissionResponse | null): Observable<unknown> {
    const module = this.resolveModule(v);

    return current
      ? unwrapApi(this.roleService.updatePermission({
          id: current.id, module, action: v.action, description: v.description
        }))
      : unwrapApi(this.roleService.createPermission({
          module, action: v.action, description: v.description
        }));
  }

  pageTitle(): string {
    return this.transloco.translate(this.isEdit() ? 'permissionsPage.editTitle' : 'permissionsPage.createTitle');
  }
}
