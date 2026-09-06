import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { LogisticUnitService } from '../../../core/services/master.service';
import { LogisticUnitResponse } from '../../../core/models/master.model';
import { TranslocoModule } from '@jsverse/transloco';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { FlashService } from '../../../core/services/flash.service';

const LIST_PATH = '/logistic-units';

@Component({
  selector: 'app-logistic-unit-list',
  standalone: true,
  imports: [TranslocoModule, PaginationComponent],
  templateUrl: './logistic-unit-list.component.html',
  styleUrl: './logistic-unit-list.component.scss'
})
export class LogisticUnitListComponent implements OnInit {
  items = signal<LogisticUnitResponse[]>([]);
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

  constructor(private svc: LogisticUnitService) {}

  ngOnInit(): void {
    const pending = this.flash.consume();
    if (pending) this.msg(pending.text, pending.type);
    this.load();
  }

  load(): void {
    this.currentPage.set(1);
    this.loading.set(true);
    this.svc.list().subscribe({
      next: res => { this.loading.set(false); if (res.success) this.items.set(res.data); },
      error: () => this.loading.set(false)
    });
  }

  goCreate(): void { this.router.navigate([LIST_PATH, 'nuevo']); }
  goView(item: LogisticUnitResponse): void { this.router.navigate([LIST_PATH, item.id]); }
  goEdit(item: LogisticUnitResponse): void { this.router.navigate([LIST_PATH, item.id, 'editar']); }

  deleteItem(item: LogisticUnitResponse): void {
    if (!confirm(`¿Eliminar "${item.name}"?`)) return;
    this.svc.delete(item.id).subscribe({
      next: res => { this.msg(res.message, res.success ? 'success' : 'error'); if (res.success) this.load(); },
      error: err => this.msg(err.error?.message ?? 'Error', 'error')
    });
  }

  toggleStatus(item: LogisticUnitResponse): void {
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
