/** Tipos de campo soportados por el formulario dinámico (sin Angular Material). */
export type FormFieldType = 'text' | 'textarea' | 'number' | 'email' | 'select' | 'checkbox';

export interface SelectOption {
  value: string | number | boolean;
  /** Etiqueta visible (texto literal o clave i18n, según el consumidor). */
  label: string;
}

/**
 * Definición de un campo del formulario dinámico. `label`/`placeholder` son CLAVES de Transloco.
 */
export interface FormFieldConfig {
  key: string;
  /** Clave i18n para la etiqueta (ej. 'common.name'). */
  label: string;
  type: FormFieldType;
  required?: boolean;
  /** Clave i18n para el placeholder. */
  placeholder?: string;
  options?: SelectOption[];
}
