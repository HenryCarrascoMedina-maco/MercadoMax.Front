/** Tipo de celda soportado por la tabla genérica. */
export type ColumnType = 'text' | 'status' | 'date';

/**
 * Definición de columna para `app-data-table`. `label` es una CLAVE de Transloco
 * (la tabla la traduce). `key` es la propiedad del item a mostrar.
 */
export interface TableColumn<T = any> {
  key: keyof T & string;
  /** Clave i18n para el encabezado (ej. 'common.name'). */
  label: string;
  type?: ColumnType;
  align?: 'left' | 'center' | 'right';
  /** Formateador opcional para personalizar el texto de la celda. */
  formatter?: (row: T) => string;
}
