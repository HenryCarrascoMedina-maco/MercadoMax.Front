import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService, ProductCategoryService } from '../../../core/services/master.service';
import { ProductResponse, ProductCategoryResponse } from '../../../core/models/master.model';
import { FlashService } from '../../../core/services/flash.service';
import { TranslocoModule } from '@jsverse/transloco';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

const LIST_PATH = '/products';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [TranslocoModule, PaginationComponent],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss'
})
export class ProductListComponent implements OnInit {
  items = signal<ProductResponse[]>([]);
  categories = signal<ProductCategoryResponse[]>([]);
  loading = signal(false);
  search = signal('');
  pageSize = signal(10);
  currentPage = signal(1);
  pagedItems = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.items().slice(start, start + this.pageSize());
  });
  filterCategoryId = signal<number | undefined>(undefined);
  message = signal<{ text: string; type: 'success' | 'error' } | null>(null);

  private readonly router = inject(Router);
  private readonly flash = inject(FlashService);

  constructor(private svc: ProductService, private catSvc: ProductCategoryService) {}

  ngOnInit(): void {
    const pending = this.flash.consume();
    if (pending) this.msg(pending.text, pending.type);
    this.loadCategories();
    this.load();
  }

  goCreate(): void { this.router.navigate([LIST_PATH, 'nuevo']); }
  goView(item: ProductResponse): void { this.router.navigate([LIST_PATH, item.id]); }
  goEdit(item: ProductResponse): void { this.router.navigate([LIST_PATH, item.id, 'editar']); }

  loadCategories(): void {
    // ProductCategoryService migrado a BaseCrudService (Fase 1): getAll devuelve el array directo.
    this.catSvc.getAll({ status: true }).subscribe(data => { if (data) this.categories.set(data); });
  }

  load(): void {
    this.currentPage.set(1);
    this.loading.set(true);
    this.svc.list(undefined, this.filterCategoryId(), this.search() || undefined).subscribe({
      next: res => { this.loading.set(false); if (res.success) this.items.set(res.data); },
      error: () => this.loading.set(false)
    });
  }

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
    this.load();
  }

  onFilterCategory(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.filterCategoryId.set(val ? +val : undefined);
    this.load();
  }

  deleteItem(item: ProductResponse): void {
    if (!confirm(`¿Eliminar "${item.name}"?`)) return;
    this.svc.delete(item.id).subscribe({
      next: res => { this.msg(res.message, res.success ? 'success' : 'error'); if (res.success) this.load(); },
      error: err => this.msg(err.error?.message ?? 'Error', 'error')
    });
  }

  toggleStatus(item: ProductResponse): void {
    this.svc.toggleStatus(item.id).subscribe({
      next: res => { this.msg(res.message, res.success ? 'success' : 'error'); if (res.success) this.load(); },
      error: err => this.msg(err.error?.message ?? 'Error', 'error')
    });
  }

  onPageChange(page: number): void { this.currentPage.set(page); }
  onPageSizeChange(size: number): void { this.pageSize.set(size); this.currentPage.set(1); }
  private msg(text: string, type: 'success' | 'error'): void {
    this.message.set({ text, type });
    setTimeout(() => this.message.set(null), 4000);
  }
}
