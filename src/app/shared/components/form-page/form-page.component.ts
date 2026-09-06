import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';

/**
 * Chrome de una página de crear/ver/editar: migas, título, botón de volver y la
 * tarjeta que enmarca el contenido. Sustituye a `app-modal` cuando la acción es
 * una ruta y no un recuadro.
 *
 * El cuerpo lo proyecta la feature (su propio `<form>` con `.page-body` y
 * `.page-footer`), igual que antes proyectaba el cuerpo del modal.
 *
 *   <app-form-page [listLink]="'/product-categories'"
 *                  [listTitle]="t('categories.title')"
 *                  [title]="t('categories.createTitle')">
 *     <form ...>
 *       <div class="page-body">…</div>
 *       <div class="page-footer">…</div>
 *     </form>
 *   </app-form-page>
 */
@Component({
  selector: 'app-form-page',
  standalone: true,
  imports: [RouterLink, TranslocoModule],
  styleUrl: './form-page.component.scss',
  template: `
    <ng-container *transloco="let t">
      <nav class="page-crumb" [attr.aria-label]="t('common.breadcrumb')">
        <a [routerLink]="listLink()">{{ listTitle() }}</a>
        @if (parentTitle()) {
          <span class="sep" aria-hidden="true">›</span>
          <a [routerLink]="parentLink()">{{ parentTitle() }}</a>
        }
        <span class="sep" aria-hidden="true">›</span>
        <span class="current">{{ crumb() || title() }}</span>
      </nav>

      <div class="page-header">
        <div class="page-title">
          <h1>{{ title() }}</h1>
          @if (subtitle()) { <span class="page-subtitle">{{ subtitle() }}</span> }
        </div>
        <div class="page-actions">
          <ng-content select="[pageActions]"></ng-content>
          <a class="btn-back" [routerLink]="listLink()">
            <span aria-hidden="true">←</span> {{ t('common.backToList') }}
          </a>
        </div>
      </div>

      <ng-content select="[pageAlert]"></ng-content>

      <div class="page-card">
        <ng-content></ng-content>
      </div>
    </ng-container>
  `
})
export class FormPageComponent {
  /** Ruta del listado al que vuelve el botón "Volver" y la primera miga. */
  listLink = input.required<string>();
  /** Título del listado, ya traducido (ej. "Categorías de Producto"). */
  listTitle = input.required<string>();
  /** Título de la página, ya traducido (ej. "Nueva Categoría"). */
  title = input.required<string>();
  /** Texto de la última miga; si se omite, usa `title`. */
  crumb = input('');
  /** Dato secundario junto al título (ej. "#128"). */
  subtitle = input('');
  /** Miga intermedia, para editar desde la ficha (ej. "Cítricos" › "Editar"). */
  parentTitle = input('');
  parentLink = input('');
}
