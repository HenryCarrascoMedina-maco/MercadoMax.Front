import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { UserService } from './user.service';

/**
 * Usuario listo para pintar en un desplegable. Lleva también los datos de la
 * persona, para los formularios que los heredan de la cuenta en vez de pedirlos
 * otra vez (el nombre de un transportista, por ejemplo).
 */
export interface UserOption {
  id: number;
  label: string;
  roles: string[];
  firstName: string;
  lastName: string;
  phone: string | null;
}

/** Cuenta que ya está ocupada por otro registro. */
export interface UsedUserOption extends UserOption {
  /** Quién la ocupa, para decirlo junto al nombre. */
  usedBy: string;
}

/**
 * Opciones repartidas en dos grupos, para los campos donde una cuenta solo puede
 * usarse una vez.
 */
export interface UserChoices {
  /** Elegibles. El registro que se está editando va primero. */
  available: UserOption[];
  /** Ocupadas: se muestran en gris y al final, sin permitir el clic. */
  used: UsedUserOption[];
  /** Hay candidatos con el rol, pero todos están ocupados. */
  allTaken: boolean;
}

/**
 * Usuarios elegibles para los campos que apuntan a una persona: el propietario de
 * un puesto, el usuario de un transportista, etc.
 *
 * Existe para que la regla de "quién puede aparecer aquí" viva en un solo sitio.
 * El listado de usuarios pagina y no filtra por rol, así que el recorte se hace
 * aquí y no en cada formulario.
 */
@Injectable({ providedIn: 'root' })
export class UserPickerService {
  private readonly userService = inject(UserService);

  /** Tope del lote que se pide. Muy por encima del padrón real de este mercado. */
  private static readonly PAGE_SIZE = 200;

  /** Todos los usuarios activos, ordenados por nombre. */
  listActive(): Observable<UserOption[]> {
    return this.userService.list(undefined, 1, UserPickerService.PAGE_SIZE).pipe(
      map((res) => {
        if (!res.success) return [];
        return res.data
          .filter((u) => u.status === 1)
          .map((u) => ({
            id: u.id,
            label: `${u.firstName} ${u.lastName}`.trim(),
            roles: u.roles ?? [],
            firstName: u.firstName,
            lastName: u.lastName,
            phone: u.phone
          }))
          .sort((a, b) => a.label.localeCompare(b.label));
      })
    );
  }
}

/** Marcador para una cuenta asignada que ya no sale en el listado de usuarios. */
function orphanOption(id: number): UserOption {
  return { id, label: `#${id}`, roles: [], firstName: '', lastName: '', phone: null };
}

/**
 * Candidatos de un campo de usuario: los que tienen `role`, más el ya asignado si
 * hoy no cumple el filtro.
 *
 * Sin ese añadido, editar cualquier otro campo del registro dejaría el campo de
 * usuario vacío y lo borraría al guardar, sin que nadie lo haya pedido.
 */
function candidates(users: UserOption[], role: string, assignedId: number | null | undefined): UserOption[] {
  const list = users.filter((u) => u.roles.includes(role));
  if (assignedId && !list.some((o) => o.id === assignedId)) {
    list.unshift(users.find((u) => u.id === assignedId) ?? orphanOption(assignedId));
  }
  return list;
}

/** Opciones de un campo de usuario que admite repetirse (varios puestos por dueño). */
export function pickUserOptions(
  users: UserOption[],
  role: string,
  assignedId: number | null | undefined
): UserOption[] {
  return candidates(users, role, assignedId);
}

/**
 * Opciones de un campo de usuario de un solo uso, repartidas entre elegibles y
 * ocupadas.
 *
 * `takenBy` mapea id de usuario → quién lo ocupa. La cuenta del registro que se
 * está editando nunca cuenta como ocupada: si lo hiciera, no se podría guardar el
 * propio registro sin cambiarle el usuario.
 */
export function splitUserOptions(
  users: UserOption[],
  role: string,
  assignedId: number | null | undefined,
  takenBy: Map<number, string>
): UserChoices {
  const available: UserOption[] = [];
  const used: UsedUserOption[] = [];

  for (const option of candidates(users, role, assignedId)) {
    const takenLabel = option.id === assignedId ? undefined : takenBy.get(option.id);
    if (takenLabel) used.push({ ...option, usedBy: takenLabel });
    else available.push(option);
  }

  // El usuario del registro primero: es el valor que el desplegable muestra.
  available.sort((a, b) => {
    if (a.id === assignedId) return -1;
    if (b.id === assignedId) return 1;
    return a.label.localeCompare(b.label);
  });

  return { available, used, allTaken: available.length === 0 && used.length > 0 };
}
