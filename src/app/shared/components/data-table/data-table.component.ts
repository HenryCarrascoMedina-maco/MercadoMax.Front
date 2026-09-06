import { Component, computed, input, output, signal } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { PaginationComponent } from '../pagination/pagination.component';
import { ActionsComponent } from '../actions/actions.component';
import { TableColumn } from '../../models/table-column.model';
import { ActionConfig, ActionEvent } from '../../models/action-config.model';

/**
 * Tabla genérica (sin Angular Material). Paginación CLIENTE (igual que hoy),
 * acciones de fila y celda de estado clickable (badge-toggle). Mismas clases CSS → aspecto idéntico.
 * Emite TODO (incluido el toggle de estado) por el output `action`.
 */
@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [TranslocoModule, PaginationComponent, ActionsComponent],
  styleUrl: './data-table.component.scss',
  template: `
    <ng-container *transloco="let t">
      <div class="table-container">
        @if (loading()) {
          <div class="loading">{{ t('common.loading') }}</div>
        } @else {
          <table>
            <thead>
              <tr>
                @for (col of columns(); track col.key) {
                  <th [style.text-align]="col.align || 'left'">{{ t(col.label) }}</th>
                }
                @if (rowActions().length) { <th>{{ t('common.actions') }}</th> }
              </tr>
            </thead>
            <tbody>
              @for (row of pagedData(); track row.id) {
                <tr>
                  @for (col of columns(); track col.key) {
                    <td [style.text-align]="col.align || 'left'">
                      @switch (col.type) {
                        @case ('status') {
                          <span class="badge badge-toggle"
                                [class.badge-active]="!!row[col.key]"
                                [class.badge-inactive]="!row[col.key]"
                                (click)="action.emit({ key: 'toggleStatus', row }); $event.stopPropagation()">
                            {{ row[col.key] ? t('common.active') : t('common.inactive') }}
                          </span>
                        }
                        @default { {{ cellText(row, col) }} }
                      }
                    </td>
                  }
                  @if (rowActions().length) {
                    <td class="actions">
                      <app-actions [actions]="rowActions()" [row]="row" (action)="action.emit($event)" />
                    </td>
                  }
                </tr>
              } @empty {
                <tr>
                  <td [attr.colspan]="colspan()" class="empty">
                    {{ emptyLabel() ? t(emptyLabel()) : t('common.noResults') }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <app-pagination
        [totalItems]="data().length"
        [currentPage]="clampedPage()"
        [pageSize]="pageSize()"
        (pageChange)="currentPage.set($event)"
        (pageSizeChange)="onPageSize($event)" />
    </ng-container>
  `
})
export class DataTableComponent {
  columns = input<TableColumn[]>([]);
  data = input<any[]>([]);
  loading = input(false);
  rowActions = input<ActionConfig[]>([]);
  emptyLabel = input<string>('');

  action = output<ActionEvent>();

  readonly currentPage = signal(1);
  readonly pageSize = signal(10);

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.data().length / this.pageSize())));
  readonly clampedPage = computed(() => Math.min(this.currentPage(), this.totalPages()));
  readonly pagedData = computed(() => {
    const start = (this.clampedPage() - 1) * this.pageSize();
    return this.data().slice(start, start + this.pageSize());
  });

  colspan(): number {
    return this.columns().length + (this.rowActions().length ? 1 : 0);
  }

  cellText(row: any, col: TableColumn): string {
    const v = col.formatter ? col.formatter(row) : row[col.key];
    return (v === null || v === undefined || v === '') ? '—' : String(v);
  }

  onPageSize(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }
}
