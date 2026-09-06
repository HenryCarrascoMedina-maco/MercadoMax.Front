import { Component, input } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { DetailItem } from '../../models/detail-item.model';

/**
 * Ficha de solo lectura: rejilla de etiqueta/valor. Es lo que ve el usuario en la
 * ruta `/:id`, en lugar del formulario con los campos deshabilitados que mostraba
 * el modal en modo "ver".
 *
 * Solo pinta; el componente de la feature arma el array de `items`.
 */
@Component({
  selector: 'app-detail-view',
  standalone: true,
  imports: [TranslocoModule, DatePipe, DecimalPipe],
  template: `
    <ng-container *transloco="let t">
      <div class="detail-grid">
        @for (item of items(); track item.label) {
          <div class="detail-item" [class.span-2]="item.span">
            <span class="detail-label">{{ t(item.label) }}</span>
            @switch (item.type) {
              @case ('status') {
                <span class="badge" [class.badge-active]="!!item.value" [class.badge-inactive]="!item.value">
                  {{ item.value ? t('common.active') : t('common.inactive') }}
                </span>
              }
              @case ('date') {
                <span class="detail-value mono">{{ (dateValue(item) | date: 'dd/MM/yyyy HH:mm') || '—' }}</span>
              }
              @case ('money') {
                <span class="detail-value mono">S/ {{ (+(item.value ?? 0)) | number: '1.2-2' }}</span>
              }
              @case ('mono') {
                <span class="detail-value mono" [class.is-empty]="isEmpty(item)">{{ text(item) }}</span>
              }
              @default {
                <span class="detail-value" [class.is-empty]="isEmpty(item)">{{ text(item) }}</span>
              }
            }
          </div>
        }
      </div>
    </ng-container>
  `
})
export class DetailViewComponent {
  items = input<DetailItem[]>([]);

  isEmpty(item: DetailItem): boolean {
    return item.value === null || item.value === undefined || item.value === '';
  }

  text(item: DetailItem): string {
    return this.isEmpty(item) ? '—' : String(item.value);
  }

  /** Estrecha el valor a lo que acepta `DatePipe` (un booleano nunca es fecha). */
  dateValue(item: DetailItem): string | number | null {
    const v = item.value;
    return typeof v === 'string' || typeof v === 'number' ? v : null;
  }
}
