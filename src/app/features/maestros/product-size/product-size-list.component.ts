import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { ProductSizeService, ProductService } from '../../../core/services/master.service';
import { ProductSizeResponse, ProductResponse } from '../../../core/models/master.model';
import { TranslocoModule } from '@jsverse/transloco';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { FlashService } from '../../../core/services/flash.service';

const LIST_PATH = '/product-sizes';

@Component({
  selector: 'app-product-size-list',
  standalone: true,
  imports: [TranslocoModule, PaginationComponent],
  templateUrl: './product-size-list.component.html',
  styleUrl: './product-size-list.component.scss'
})
export class ProductSizeListComponent implements OnInit {
  items = signal<ProductSizeResponse[]>([]);
  products = signal<ProductResponse[]>([]);
  loading = signal(false);
  filterProductId = signal<number | undefined>(undefined);
  message = signal<{ text: string; type: 'success' | 'error' } | null>(null);
  pageSize = signal(10);
  currentPage = signal(1);
  pagedItems = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.items().slice(start, start + this.pageSize());
  });

  private readonly router = inject(Router);
  private readonly flash = inject(FlashService);

  constructor(private svc: ProductSizeService, private prodSvc: ProductService) {}

  ngOnInit(): void {
    const pending = this.flash.consume();
    if (pending) this.msg(pending.text, pending.type);
    this.prodSvc.list(true).subscribe(res => { if (res.success) this.products.set(res.data); });
    this.load();
  }

  load(): void {
    this.currentPage.set(1);
    this.loading.set(true);
    this.svc.list(undefined, this.filterProductId()).subscribe({
      next: res => { this.loading.set(false); if (res.success) this.items.set(res.data); },
      error: () => this.loading.set(false)
    });
  }

  onFilterProduct(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.filterProductId.set(val ? +val : undefined);
    this.load();
  }

  goCreate(): void { this.router.navigate([LIST_PATH, 'nuevo']); }
  goView(item: ProductSizeResponse): void { this.router.navigate([LIST_PATH, item.id]); }
  goEdit(item: ProductSizeResponse): void { this.router.navigate([LIST_PATH, item.id, 'editar']); }

  deleteItem(item: ProductSizeResponse): void {
    if (!confirm(`¿Eliminar "${item.name}"?`)) return;
    this.svc.delete(item.id).subscribe({
      next: res => { this.msg(res.message, res.success ? 'success' : 'error'); if (res.success) this.load(); },
      error: err => this.msg(err.error?.message ?? 'Error', 'error')
    });
  }

  toggleStatus(item: ProductSizeResponse): void {
    this.svc.toggleStatus(item.id).subscribe({
      next: res => { this.msg(res.message, res.success ? 'success' : 'error'); if (res.success) this.load(); },
      error: err => this.msg(err.error?.message ?? 'Error', 'error')
    });
  }

  onPageChange(page: number): void { this.currentPage.set(page); }
  onPageSizeChange(size: number): void { this.pageSize.set(size); this.currentPage.set(1); }
  private msg(text: string, type: 'success' | 'error'): void {
    this.message.set({ text, type }); setTimeout(() => this.message.set(null), 4000);
  }
}
