import { Component, input } from '@angular/core';

/** Nombres de icono disponibles. Añade el trazo en el @switch al agregar uno nuevo. */
export type IconName =
  | 'eye' | 'edit' | 'trash' | 'search' | 'plus' | 'close'
  | 'reset' | 'receipt' | 'ban' | 'calendar' | 'check' | 'alert'
  | 'card' | 'clock';

/**
 * Icono SVG de trazo (estilo Lucide, 24x24). Reemplaza los emoji: se ven igual en
 * todos los sistemas, heredan el color del texto vía `currentColor` y escalan sin
 * pixelarse. El tamaño se controla con `size` o con `font-size` del contenedor.
 */
@Component({
  selector: 'app-icon',
  standalone: true,
  styles: [`
    :host { display: inline-flex; align-items: center; justify-content: center; }
    svg { display: block; }
  `],
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" [attr.stroke-width]="strokeWidth()"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
      @switch (name()) {
        @case ('eye') {
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        }
        @case ('edit') {
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
        }
        @case ('trash') {
          <path d="M3 6h18" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="M10 11v6" /><path d="M14 11v6" />
        }
        @case ('search') {
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        }
        @case ('plus') {
          <path d="M5 12h14" /><path d="M12 5v14" />
        }
        @case ('close') {
          <path d="M18 6 6 18" /><path d="m6 6 12 12" />
        }
        @case ('reset') {
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        }
        @case ('receipt') {
          <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
          <path d="M8 8h8" /><path d="M8 12h8" /><path d="M8 16h5" />
        }
        @case ('ban') {
          <circle cx="12" cy="12" r="10" />
          <path d="m4.9 4.9 14.2 14.2" />
        }
        @case ('calendar') {
          <path d="M8 2v4" /><path d="M16 2v4" />
          <rect width="18" height="18" x="3" y="4" rx="2" />
          <path d="M3 10h18" />
        }
        @case ('check') {
          <path d="M20 6 9 17l-5-5" />
        }
        @case ('alert') {
          <path d="M12 9v4" /><path d="M12 17h.01" />
          <circle cx="12" cy="12" r="10" />
        }
        @case ('card') {
          <rect width="20" height="14" x="2" y="5" rx="2" />
          <path d="M2 10h20" />
        }
        @case ('clock') {
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        }
      }
    </svg>
  `
})
export class IconComponent {
  name = input.required<IconName>();
  /** Lado del icono en px. */
  size = input(18);
  strokeWidth = input(2);
}
