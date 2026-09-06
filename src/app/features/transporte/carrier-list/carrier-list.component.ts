import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { CarrierService } from '../../../core/services/transport.service';
import { CarrierResponse } from '../../../core/models/transport.model';
import { FlashService } from '../../../core/services/flash.service';

const LIST_PATH = '/carriers';

@Component({
  selector: 'app-carrier-list',
  standalone: true,
  imports: [TranslocoModule, PaginationComponent],
  templateUrl: './carrier-list.component.html',
  styleUrl: './carrier-list.component.scss'
})
export class CarrierListComponent implements OnInit {
  items = signal<CarrierResponse[]>([]);
  loading = signal(false);
  search = signal('');
  pageSize = signal(10);
  currentPage = signal(1);
  pagedItems = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.items().slice(start, start + this.pageSize());
  });
  message = signal<{ text: string; type: 'success' | 'error' } | null>(null);

  private readonly router = inject(Router);
  private readonly flash = inject(FlashService);

  constructor(private svc: CarrierService) {}

  ngOnInit(): void {
    const pending = this.flash.consume();
    if (pending) this.msg(pending.text, pending.type);
    this.load();
  }

  load(): void {
    this.currentPage.set(1);
    this.loading.set(true);
    this.svc.list(undefined, this.search() || undefined).subscribe({
      next: (res) => { this.loading.set(false); if (res.success) this.items.set(res.data); },
      error: () => this.loading.set(false)
    });
  }

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
    this.load();
  }

  goCreate(): void { this.router.navigate([LIST_PATH, 'nuevo']); }
  goView(item: CarrierResponse): void { this.router.navigate([LIST_PATH, item.id]); }
  goEdit(item: CarrierResponse): void { this.router.navigate([LIST_PATH, item.id, 'editar']); }

  deleteItem(item: CarrierResponse): void {
    if (!confirm(`¿Eliminar "${item.firstName} ${item.lastName}"?`)) return;
    this.svc.delete(item.id).subscribe({
      next: (res) => { this.msg(res.message, res.success ? 'success' : 'error'); if (res.success) this.load(); },
      error: (err: any) => this.msg(err.error?.message ?? 'Error', 'error')
    });
  }

  toggleStatus(item: CarrierResponse): void {
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
