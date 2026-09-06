import { Component, computed, input, output } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [TranslocoModule],
  template: `
    <ng-container *transloco="let t">
    @if (totalItems() > 0) {
      <div class="pagination-bar">
        <div class="pagination-info">
          <span>{{ t('pagination.showing') }} {{ startItem() }}–{{ endItem() }} {{ t('pagination.of') }} {{ totalItems() }}</span>
        </div>

        <div class="pagination-controls">
          <select class="page-size-select" [value]="pageSize()" (change)="onPageSizeChange($event)">
            @for (size of pageSizes; track size) {
              <option [value]="size">{{ size }}</option>
            }
          </select>
          <span class="page-label">{{ t('pagination.itemsPerPage') }}</span>
        </div>

        @if (totalPages() > 1) {
          <div class="pagination-pages">
            <button [disabled]="currentPage() === 1" (click)="goTo(1)">&laquo;</button>
            <button [disabled]="currentPage() === 1" (click)="goTo(currentPage() - 1)">&lsaquo;</button>
            @for (p of visiblePages(); track p) {
              <button [class.active]="p === currentPage()" (click)="goTo(p)">{{ p }}</button>
            }
            <button [disabled]="currentPage() === totalPages()" (click)="goTo(currentPage() + 1)">&rsaquo;</button>
            <button [disabled]="currentPage() === totalPages()" (click)="goTo(totalPages())">&raquo;</button>
          </div>
        }
      </div>
    }
    </ng-container>
  `,
  styles: [`
    .pagination-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 16px;
      font-size: 13px;
      color: var(--text-secondary);
    }
    .pagination-info { white-space: nowrap; }
    .pagination-controls { display: flex; align-items: center; gap: 8px; }
    .page-size-select {
      padding: 4px 8px; border: 1px solid var(--border-color); border-radius: 4px;
      background: var(--input-bg); color: var(--text-primary); font-size: 13px; cursor: pointer;
    }
    .page-label { white-space: nowrap; }
    .pagination-pages {
      display: flex; gap: 4px;
      button {
        padding: 6px 12px; border: 1px solid var(--border-color); background: var(--bg-surface);
        border-radius: 4px; cursor: pointer; font-size: 13px; color: var(--text-primary);
        &.active { background: var(--primary-color); color: #fff; border-color: var(--primary-color); }
        &:hover:not(.active):not(:disabled) { background: var(--bg-surface-hover); }
        &:disabled { opacity: 0.4; cursor: not-allowed; }
      }
    }
  `]
})
export class PaginationComponent {
  totalItems = input.required<number>();
  currentPage = input.required<number>();
  pageSize = input.required<number>();

  pageChange = output<number>();
  pageSizeChange = output<number>();

  readonly pageSizes = [10, 25, 50, 100];

  totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize()) || 1);
  startItem = computed(() => (this.currentPage() - 1) * this.pageSize() + 1);
  endItem = computed(() => Math.min(this.currentPage() * this.pageSize(), this.totalItems()));

  visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    const maxVisible = 5;

    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    let end = start + maxVisible - 1;
    if (end > total) {
      end = total;
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  });

  goTo(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.pageChange.emit(page);
    }
  }

  onPageSizeChange(event: Event): void {
    this.pageSizeChange.emit(+(event.target as HTMLSelectElement).value);
  }
}
