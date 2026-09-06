import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { roleLabels } from '../utils/role-name.util';

/**
 * Traduce el identificador de un rol a su nombre visible. Acepta un nombre
 * suelto o la lista de roles de un usuario:
 *
 *   {{ role.name | roleName }}     → "Administrador"
 *   {{ user.roles | roleName }}    → "Administrador, Comerciante"
 *
 * La regla de traducción y su fallback viven en `roleLabels`, para que las
 * pantallas que arman su contenido en TypeScript — como la ficha de usuario —
 * usen exactamente la misma.
 *
 * Es impuro a propósito: el selector de idioma del topbar cambia la traducción
 * sin que cambie la referencia de entrada, y un pipe puro devolvería el valor
 * cacheado. El coste es despreciable: es una búsqueda en un diccionario.
 */
@Pipe({ name: 'roleName', standalone: true, pure: false })
export class RoleNamePipe implements PipeTransform {
  private readonly transloco = inject(TranslocoService);

  transform(value: string | string[] | null | undefined, separator = ', '): string {
    return roleLabels(this.transloco, value, separator);
  }
}
