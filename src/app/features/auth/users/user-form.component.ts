import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { UserService } from '../../../core/services/user.service';
import { RoleService } from '../../../core/services/role.service';
import {
  UserResponse, CreateUserRequest, UpdateUserRequest,
  RoleResponse, PermissionResponse
} from '../../../core/models/auth.model';
import { CrudFormPageBase } from '../../../shared/base/crud-form-page.base';
import { FormPageComponent } from '../../../shared/components/form-page/form-page.component';
import { RoleNamePipe } from '../../../shared/pipes/role-name.pipe';
import { apiError } from '../../../shared/utils/api-response.operators';

/**
 * Alta y edición de usuarios (`/nuevo`, `/:id/editar`), con roles y permisos.
 *
 * Al crear solo se piden los datos básicos: roles y permisos se asignan editando,
 * que es cuando ya existe el id contra el que colgarlos.
 *
 * ── Cómo se combinan roles y permisos ──────────────────────
 *
 * En la base de datos `UserPermission` es la verdad: es la tabla que consulta el
 * login para armar el token. Los roles son plantillas que la rellenan — asignar
 * un rol no concede nada por sí solo (`SP_ASSIGN_ROLE` solo escribe en
 * `UserRole`), los permisos se copian aparte.
 *
 * Por eso lo marcado en pantalla no se guarda como un acumulado, sino que se
 * deriva de tres piezas:
 *
 *   marcado = (permisos de los roles elegidos − quitados a mano) ∪ añadidos a mano
 *
 * Así, quitar un rol se lleva sus permisos, y ponerlo los trae de vuelta, sin
 * tocar los extras que se marcaron a mano. Antes la unión era solo acumulativa:
 * al cambiar de rol se quedaban los permisos del rol anterior.
 */
@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoModule, FormPageComponent, RoleNamePipe],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss'
})
export class UserFormComponent extends CrudFormPageBase<UserResponse> implements OnInit {
  private readonly userService = inject(UserService);
  private readonly roleService = inject(RoleService);
  private readonly fb = inject(FormBuilder);

  protected readonly listPath = '/users';

  readonly allRoles = signal<RoleResponse[]>([]);
  readonly userRoleIds = signal<Set<number>>(new Set());
  private readonly originalRoleIds = signal<Set<number>>(new Set());

  /** Permisos de cada rol. Se precargan todos para que marcar y desmarcar sea inmediato. */
  private readonly rolePermissionMap = signal<Map<number, Set<number>>>(new Map());

  /** Permisos marcados a mano que ningún rol elegido concede. */
  private readonly manualAdded = signal<Set<number>>(new Set());
  /** Permisos que un rol elegido concede pero se desmarcaron a mano. */
  private readonly manualRemoved = signal<Set<number>>(new Set());

  /** `UserPermission` tal como estaba al abrir: la base contra la que se calcula el diff. */
  private readonly originalDirectPermissionIds = signal<Set<number>>(new Set());

  readonly permissionsByModule = signal<Map<string, PermissionResponse[]>>(new Map());
  readonly showPermissionsPanel = signal(false);

  /** Lo que conceden los roles elegidos ahora mismo. */
  readonly rolePermissionIds = computed<Set<number>>(() => {
    const map = this.rolePermissionMap();
    const result = new Set<number>();
    for (const roleId of this.userRoleIds()) {
      for (const permId of map.get(roleId) ?? []) result.add(permId);
    }
    return result;
  });

  /** Lo que quedará guardado en `UserPermission`, y lo que se ve marcado. */
  readonly userPermissionIds = computed<Set<number>>(() => {
    const removed = this.manualRemoved();
    const result = new Set<number>();
    for (const id of this.rolePermissionIds()) {
      if (!removed.has(id)) result.add(id);
    }
    for (const id of this.manualAdded()) result.add(id);
    return result;
  });

  ngOnInit(): void {
    this.initPage();
  }

  protected override buildForm(): FormGroup {
    return this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      phoneNumber: ['']
    });
  }

  protected override loadLookups(): void {
    this.roleService.listAllPermissions().subscribe((res) => {
      if (!res.success) return;
      const map = new Map<string, PermissionResponse[]>();
      for (const p of res.data) {
        if (!map.has(p.module)) map.set(p.module, []);
        map.get(p.module)!.push(p);
      }
      this.permissionsByModule.set(map);
    });
  }

  protected override fetchById(id: number): Observable<UserResponse | null> {
    return this.userService.getById(id).pipe(map((res) => (res.success ? res.data : null)));
  }

  protected override toFormValue(row: UserResponse) {
    return {
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      phoneNumber: row.phone
    };
  }

  /** Al editar no se pide la contraseña: se cambia desde "olvidé mi contraseña". */
  protected override afterInit(): void {
    if (!this.isEdit()) return;
    const password = this.form?.get('password');
    password?.clearValidators();
    password?.updateValueAndValidity();
  }

  /**
   * Reconstruye el estado de la matriz. Necesita las tres cosas a la vez —roles,
   * permisos de cada rol y permisos directos del usuario— porque el reparto entre
   * "viene del rol" y "se puso a mano" solo se puede deducir comparándolas.
   */
  protected override afterRecordLoaded(row: UserResponse): void {
    forkJoin({
      roles: this.roleService.list(),
      direct: this.userService.getDirectPermissionIds(row.id)
    }).pipe(
      switchMap(({ roles, direct }) => {
        const roleList = roles.success ? roles.data : [];
        this.allRoles.set(roleList);

        if (roleList.length === 0) return of({ roleList, direct, perms: [] as any[] });

        return forkJoin(roleList.map((r) => this.roleService.getPermissionsByRole(r.id))).pipe(
          map((perms) => ({ roleList, direct, perms }))
        );
      })
    ).subscribe(({ roleList, direct, perms }) => {
      const map = new Map<number, Set<number>>();
      roleList.forEach((role, i) => {
        const res: any = perms[i];
        map.set(role.id, new Set<number>(res?.success ? res.data.map((p: PermissionResponse) => p.id) : []));
      });
      this.rolePermissionMap.set(map);

      // Los roles del usuario llegan por nombre; hay que casarlos con su id.
      const roleSet = new Set<number>();
      for (const roleName of row.roles ?? []) {
        const match = roleList.find((r) => r.name === roleName);
        if (match) roleSet.add(match.id);
      }
      this.userRoleIds.set(roleSet);
      this.originalRoleIds.set(new Set(roleSet));

      const directSet = new Set<number>(direct.success ? direct.data : []);
      this.originalDirectPermissionIds.set(new Set(directSet));

      // De los roles elegidos sale lo que "debería" tener; la diferencia con lo que
      // tiene de verdad es lo que alguien ajustó a mano en algún momento.
      const fromRoles = new Set<number>();
      for (const roleId of roleSet) {
        for (const permId of map.get(roleId) ?? []) fromRoles.add(permId);
      }

      const added = new Set<number>();
      for (const id of directSet) if (!fromRoles.has(id)) added.add(id);

      const removed = new Set<number>();
      for (const id of fromRoles) if (!directSet.has(id)) removed.add(id);

      this.manualAdded.set(added);
      this.manualRemoved.set(removed);
    });
  }

  protected override persist(v: any, current: UserResponse | null): Observable<unknown> {
    if (!current) {
      const req: CreateUserRequest = {
        firstName: v.firstName, lastName: v.lastName, email: v.email,
        password: v.password, phone: v.phoneNumber || undefined
      };
      return this.userService.create(req).pipe(
        map((res) => { if (!res.success) throw apiError(res.message); return res.data; })
      );
    }

    const req: UpdateUserRequest = {
      id: current.id, firstName: v.firstName, lastName: v.lastName,
      email: v.email, phone: v.phoneNumber || undefined
    };
    return this.userService.update(req).pipe(
      map((res) => { if (!res.success) throw apiError(res.message); return res.data; }),
      switchMap(() => this.syncRolesAndPermissions(current.id))
    );
  }

  pageTitle(): string {
    return this.transloco.translate(this.isEdit() ? 'users.editTitle' : 'users.createTitle');
  }

  // ── Roles y permisos ────────────────────────────────────

  isRoleAssigned(roleId: number): boolean { return this.userRoleIds().has(roleId); }
  isPermissionAssigned(permissionId: number): boolean { return this.userPermissionIds().has(permissionId); }

  /** Marcado porque lo concede un rol elegido. */
  isFromRole(permissionId: number): boolean {
    return this.rolePermissionIds().has(permissionId) && !this.manualRemoved().has(permissionId);
  }

  /** Marcado a mano, por encima de lo que dan los roles. */
  isExtra(permissionId: number): boolean {
    return this.manualAdded().has(permissionId);
  }

  /** Cuántos permisos marcados no vienen de ningún rol. */
  readonly extraCount = computed(() => this.manualAdded().size);

  get permissionModules(): string[] { return Array.from(this.permissionsByModule().keys()); }

  getPermissionsForModule(module: string): PermissionResponse[] {
    return this.permissionsByModule().get(module) ?? [];
  }

  /**
   * Marcar o desmarcar un rol. Los permisos se recalculan solos: lo único que hay
   * que hacer aquí es limpiar los "quitados a mano" del rol que se acaba de
   * marcar, porque marcarlo es pedir sus permisos.
   */
  toggleRole(roleId: number): void {
    const roles = new Set(this.userRoleIds());

    if (roles.has(roleId)) {
      roles.delete(roleId);
      this.userRoleIds.set(roles);
      return;
    }

    roles.add(roleId);
    this.userRoleIds.set(roles);

    const rolePerms = this.rolePermissionMap().get(roleId);
    if (!rolePerms?.size) return;

    const removed = new Set(this.manualRemoved());
    let changed = false;
    for (const id of rolePerms) {
      if (removed.delete(id)) changed = true;
    }
    if (changed) this.manualRemoved.set(removed);
  }

  /**
   * Marcar o desmarcar un permiso suelto. Según de dónde venga, el ajuste va a
   * "añadidos a mano" o a "quitados a mano"; nunca se toca la selección de roles.
   */
  togglePermission(permissionId: number): void {
    const fromRole = this.rolePermissionIds().has(permissionId);
    const isChecked = this.userPermissionIds().has(permissionId);

    if (fromRole) {
      const removed = new Set(this.manualRemoved());
      if (isChecked) removed.add(permissionId);
      else removed.delete(permissionId);
      this.manualRemoved.set(removed);
      return;
    }

    const added = new Set(this.manualAdded());
    if (isChecked) added.delete(permissionId);
    else added.add(permissionId);
    this.manualAdded.set(added);
  }

  /** Deja el usuario exactamente con los permisos que dan sus roles. */
  resetToRoles(): void {
    this.manualAdded.set(new Set());
    this.manualRemoved.set(new Set());
  }

  /**
   * Traduce la diferencia entre lo que había y lo marcado a llamadas de asignar y
   * revocar.
   *
   * No se usa `assign-role-permissions`: ese endpoint copia en bloque los permisos
   * del rol, y como estas llamadas van en paralelo podría insertar justo lo que
   * otra llamada está quitando. El diff de permisos ya incluye lo que aportan los
   * roles, así que el resultado no depende del orden.
   */
  private syncRolesAndPermissions(userId: number): Observable<unknown> {
    const origRoles = this.originalRoleIds();
    const newRoles = this.userRoleIds();
    const origPerms = this.originalDirectPermissionIds();
    const newPerms = this.userPermissionIds();

    const calls: Observable<any>[] = [];

    for (const roleId of origRoles) {
      if (!newRoles.has(roleId)) calls.push(this.userService.removeRole(userId, roleId));
    }
    for (const roleId of newRoles) {
      if (!origRoles.has(roleId)) calls.push(this.userService.assignRole({ userId, roleId }));
    }

    for (const permId of newPerms) {
      if (!origPerms.has(permId)) calls.push(this.userService.assignPermission({ userId, permissionId: permId }));
    }
    for (const permId of origPerms) {
      if (!newPerms.has(permId)) calls.push(this.userService.removePermission(userId, permId));
    }

    if (calls.length === 0) return of(null);

    return forkJoin(calls).pipe(
      // Los permisos van en el token: sin revocar la sesión seguiría con los viejos.
      switchMap(() => this.userService.revokeSession(userId))
    );
  }
}
