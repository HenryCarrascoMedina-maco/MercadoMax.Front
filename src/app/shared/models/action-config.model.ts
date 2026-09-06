/**
 * Acción de fila para `app-actions` / `app-data-table`.
 * `label` es clave i18n; `permission` (opcional) oculta el botón vía *hasPermission.
 */
export interface ActionConfig<T = any> {
  key: string;
  /** Ícono (emoji o texto), mismo estilo `btn-icon` actual. */
  icon: string;
  /** Clave i18n para el tooltip. */
  label: string;
  /** Permiso "Modulo:Accion" requerido para ver la acción (opcional). */
  permission?: string;
}

/** Evento emitido al pulsar una acción de fila. */
export interface ActionEvent<T = any> {
  key: string;
  row: T;
}
