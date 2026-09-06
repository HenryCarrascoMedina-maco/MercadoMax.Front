import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { InventoryService } from '../../../core/services/merchant.service';
import { InventoryResponse } from '../../../core/models/merchant.model';
import { FlashService } from '../../../core/services/flash.service';

const LIST_PATH = '/inventory';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [DatePipe, DecimalPipe, TranslocoModule, PaginationComponent],
  templateUrl: './inventory-list.component.html',
  styleUrl: './inventory-list.component.scss'
})
export class InventoryListComponent implements OnInit {
  items = signal<InventoryResponse[]>([]);
  loading = signal(false);
  message = signal<{ text: string; type: 'success' | 'error' } | null>(null);
  filterLowStock = signal(false);
  pageSize = signal(10);
  currentPage = signal(1);
  pagedItems = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.items().slice(start, start + this.pageSize());
  });

  private readonly router = inject(Router);
  private readonly flash = inject(FlashService);

  constructor(private svc: InventoryService) {}

  ngOnInit(): void {
    const pending = this.flash.consume();
    if (pending) this.msg(pending.text, pending.type);
    this.load();
  }

  load(): void {
    this.currentPage.set(1);
    this.loading.set(true);
    const lowStock = this.filterLowStock() ? true : undefined;
    this.svc.list(undefined, undefined, lowStock).subscribe({
      next: (res) => { this.loading.set(false); if (res.success) this.items.set(res.data); },
      error: () => this.loading.set(false)
    });
  }

  toggleLowStock(): void {
    this.filterLowStock.update((v: boolean) => !v);
    this.load();
  }

  goCreate(): void { this.router.navigate([LIST_PATH, 'nuevo']); }
  goView(item: InventoryResponse): void { this.router.navigate([LIST_PATH, item.id]); }
  goEdit(item: InventoryResponse): void { this.router.navigate([LIST_PATH, item.id, 'editar']); }

  onPageChange(page: number): void { this.currentPage.set(page); }
  onPageSizeChange(size: number): void { this.pageSize.set(size); this.currentPage.set(1); }
  private msg(text: string, type: 'success' | 'error'): void {
    this.message.set({ text, type });
    setTimeout(() => this.message.set(null), 4000);
  }
}
