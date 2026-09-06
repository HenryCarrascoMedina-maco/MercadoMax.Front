import { TranslocoService } from '@jsverse/transloco';

/**
 * Nombre visible de un rol a partir de su identificador.
 *
 * El identificador (`Admin`, `ReceptionManager`) es el que viaja en el JWT y
 * contra el que compara la lógica de permisos, así que no se traduce en base de
 * datos: solo al pintarlo. Las traducciones viven en `roleNames` de cada
 * `public/i18n/<lang>.json`.
 *
 * Un rol creado sin traducción se muestra con su identificador, en vez de dejar
 * a la vista la clave `roleNames.X`.
 */
export function roleLabel(transloco: TranslocoService, name: string): string {
  const key = `roleNames.${name}`;
  const label = transloco.translate(key);
  // Transloco devuelve la clave cuando no existe: eso es el "no hay traducción".
  return label === key ? name : label;
}

/** Igual que `roleLabel` pero para la lista de roles de un usuario. */
export function roleLabels(
  transloco: TranslocoService,
  value: string | string[] | null | undefined,
  separator = ', '
): string {
  if (value === null || value === undefined) return '';
  const names = Array.isArray(value) ? value : [value];
  return names
    .filter((name) => !!name)
    .map((name) => roleLabel(transloco, name))
    .join(separator);
}
