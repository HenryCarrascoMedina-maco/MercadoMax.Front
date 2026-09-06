import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { TransportRateService } from '../../../core/services/transport.service';
import { TransportRateResponse } from '../../../core/models/transport.model';
import { FlashService } from '../../../core/services/flash.service';

const LIST_PATH = '/transport-rates';

@Component({
  selector: 'app-transport-rate-list',
  standalone: true,
  imports: [DatePipe, DecimalPipe, TranslocoModule, PaginationComponent],
  templateUrl: './transport-rate-list.component.html',
  styleUrl: './transport-rate-list.component.scss'
})
export class TransportRateListComponent implements OnInit {
  items = signal<TransportRateResponse[]>([]);
  loading = signal(false);
  message = signal<{ text: string; type: 'success' | 'error' } | null>(null);
  pageSize = signal(10);
  currentPage = signal(1);
  pagedItems = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.items().slice(start, start + this.pageSize());
  });

  private readonly router = inject(Router);
  private readonly flash = inject(FlashService);

  constructor(private svc: TransportRateService) {}

  ngOnInit(): void {
    const pending = this.flash.consume();
    if (pending) this.msg(pending.text, pending.type);
    this.load();
  }

  load(): void {
    this.currentPage.set(1);
    this.loading.set(true);
    this.svc.list().subscribe({
      next: (res) => { this.loading.set(false); if (res.success) this.items.set(res.data); },
      error: () => this.loading.set(false)
    });
  }

  goCreate(): void { this.router.navigate([LIST_PATH, 'nuevo']); }
  goView(item: TransportRateResponse): void { this.router.navigate([LIST_PATH, item.id]); }
  goEdit(item: TransportRateResponse): void { this.router.navigate([LIST_PATH, item.id, 'editar']); }

  deleteItem(item: TransportRateResponse): void {
    if (!confirm(`¿Eliminar tarifa de "${item.carrierName}"?`)) return;
    this.svc.delete(item.id).subscribe({
      next: (res) => { this.msg(res.message, res.success ? 'success' : 'error'); if (res.success) this.load(); },
      error: (err: any) => this.msg(err.error?.message ?? 'Error', 'error')
    });
  }

  toggleStatus(item: TransportRateResponse): void {
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
