import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { BrandService, SupplierService, ProductService } from '../../../core/services/master.service';
import { BrandResponse, SupplierResponse, ProductResponse } from '../../../core/models/master.model';
import { TranslocoModule } from '@jsverse/transloco';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { FlashService } from '../../../core/services/flash.service';

const LIST_PATH = '/brands';

@Component({
  selector: 'app-brand-list',
  standalone: true,
  imports: [TranslocoModule, PaginationComponent],
  templateUrl: './brand-list.component.html',
  styleUrl: './brand-list.component.scss'
})
export class BrandListComponent implements OnInit {
  items = signal<BrandResponse[]>([]);
  suppliers = signal<SupplierResponse[]>([]);
  products = signal<ProductResponse[]>([]);
  loading = signal(false);
  search = signal('');
  pageSize = signal(10);
  currentPage = signal(1);
  pagedItems = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.items().slice(start, start + this.pageSize());
  });
  filterSupplierId = signal<number | undefined>(undefined);
  filterProductId = signal<number | undefined>(undefined);
  message = signal<{ text: string; type: 'success' | 'error' } | null>(null);

  private readonly router = inject(Router);
  private readonly flash = inject(FlashService);

  constructor(private svc: BrandService, private supSvc: SupplierService, private prodSvc: ProductService) {}

  ngOnInit(): void {
    const pending = this.flash.consume();
    if (pending) this.msg(pending.text, pending.type);
    this.supSvc.list(true).subscribe(res => { if (res.success) this.suppliers.set(res.data); });
    this.prodSvc.list(true).subscribe(res => { if (res.success) this.products.set(res.data); });
    this.load();
  }

  load(): void {
    this.currentPage.set(1);
    this.loading.set(true);
    this.svc.list(undefined, this.filterSupplierId(), this.filterProductId(), this.search() || undefined).subscribe({
      next: res => { this.loading.set(false); if (res.success) this.items.set(res.data); },
      error: () => this.loading.set(false)
    });
  }

  onSearch(event: Event): void { this.search.set((event.target as HTMLInputElement).value); this.load(); }
  onFilterSupplier(event: Event): void { const v = (event.target as HTMLSelectElement).value; this.filterSupplierId.set(v ? +v : undefined); this.load(); }
  onFilterProduct(event: Event): void { const v = (event.target as HTMLSelectElement).value; this.filterProductId.set(v ? +v : undefined); this.load(); }

  goCreate(): void { this.router.navigate([LIST_PATH, 'nuevo']); }
  goView(item: BrandResponse): void { this.router.navigate([LIST_PATH, item.id]); }
  goEdit(item: BrandResponse): void { this.router.navigate([LIST_PATH, item.id, 'editar']); }

  deleteItem(item: BrandResponse): void {
    if (!confirm(`¿Eliminar "${item.name}"?`)) return;
    this.svc.delete(item.id).subscribe({
      next: res => { this.msg(res.message, res.success ? 'success' : 'error'); if (res.success) this.load(); },
      error: err => this.msg(err.error?.message ?? 'Error', 'error')
    });
  }

  toggleStatus(item: BrandResponse): void {
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
