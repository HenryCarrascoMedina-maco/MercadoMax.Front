import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { ReceptionService } from '../../../core/services/reception.service';
import { ReceptionListResponse } from '../../../core/models/reception.model';
import { FlashService } from '../../../core/services/flash.service';

const LIST_PATH = '/receptions';

@Component({
  selector: 'app-reception-list',
  standalone: true,
  imports: [DatePipe, TranslocoModule],
  templateUrl: './reception-list.component.html',
  styleUrl: './reception-list.component.scss'
})
export class ReceptionListComponent implements OnInit {
  items = signal<ReceptionListResponse[]>([]);
  loading = signal(false);
  totalRecords = signal(0);
  pageNumber = signal(1);
  pageSize = signal(10);
  message = signal<{ text: string; type: 'success' | 'error' } | null>(null);
  filterStatus = signal('');

  private readonly router = inject(Router);
  private readonly flash = inject(FlashService);

  constructor(private svc: ReceptionService) {}

  ngOnInit(): void {
    const pending = this.flash.consume();
    if (pending) this.msg(pending.text, pending.type);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const status = this.filterStatus() || undefined;
    this.svc.list(status, undefined, undefined, undefined, this.pageNumber(), this.pageSize()).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) { this.items.set(res.data); this.totalRecords.set(res.totalRecords); }
      },
      error: () => this.loading.set(false)
    });
  }

  onFilterStatus(event: Event): void {
    this.filterStatus.set((event.target as HTMLSelectElement).value);
    this.pageNumber.set(1);
    this.load();
  }

  prevPage(): void {
    if (this.pageNumber() > 1) { this.pageNumber.update((p: number) => p - 1); this.load(); }
  }

  nextPage(): void {
    const totalPages = Math.ceil(this.totalRecords() / this.pageSize());
    if (this.pageNumber() < totalPages) { this.pageNumber.update((p: number) => p + 1); this.load(); }
  }

  goCreate(): void { this.router.navigate([LIST_PATH, 'nuevo']); }
  goView(item: ReceptionListResponse): void { this.router.navigate([LIST_PATH, item.id]); }

  updateStatus(item: ReceptionListResponse, newStatus: string): void {
    this.svc.updateStatus({ id: item.id, receptionStatus: newStatus }).subscribe({
      next: (res) => { this.msg(res.message, res.success ? 'success' : 'error'); if (res.success) this.load(); },
      error: (err: any) => this.msg(err.error?.message ?? 'Error', 'error')
    });
  }

  statusBadgeClass(status: string): string {
    switch (status) {
      case 'Pendiente': return 'badge badge-warning';
      case 'EnProceso': return 'badge badge-info';
      case 'Completada': return 'badge badge-success';
      case 'ConFaltantes': return 'badge badge-error';
      default: return 'badge';
    }
  }

  private msg(text: string, type: 'success' | 'error'): void {
    this.message.set({ text, type });
    setTimeout(() => this.message.set(null), 4000);
  }
}
