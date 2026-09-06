/** Cómo se pinta el valor de una fila de la ficha de solo lectura. */
export type DetailItemType = 'text' | 'status' | 'date' | 'money' | 'mono';

/**
 * Fila de `app-detail-view`: etiqueta arriba, dato debajo.
 * `label` es una CLAVE de Transloco; `value` ya viene resuelto.
 */
export interface DetailItem {
  label: string;
  value: string | number | boolean | null | undefined;
  type?: DetailItemType;
  /** Ocupa el ancho completo de la rejilla (descripciones, direcciones). */
  span?: boolean;
}
