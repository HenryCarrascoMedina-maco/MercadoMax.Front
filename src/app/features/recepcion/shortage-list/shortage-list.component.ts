import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { ShortageService } from '../../../core/services/reception.service';
import { ShortageResponse } from '../../../core/models/reception.model';
import { FlashService } from '../../../core/services/flash.service';

const LIST_PATH = '/shortages';

@Component({
  selector: 'app-shortage-list',
  standalone: true,
  imports: [DatePipe, TranslocoModule],
  templateUrl: './shortage-list.component.html',
  styleUrl: './shortage-list.component.scss'
})
export class ShortageListComponent implements OnInit {
  items = signal<ShortageResponse[]>([]);
  loading = signal(false);
  totalRecords = signal(0);
  pageNumber = signal(1);
  pageSize = signal(10);
  message = signal<{ text: string; type: 'success' | 'error' } | null>(null);
  filterStatus = signal('');

  private readonly router = inject(Router);
  private readonly flash = inject(FlashService);

  constructor(private svc: ShortageService) {}

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

  updateClaimStatus(item: ShortageResponse, newStatus: string): void {
    this.svc.updateStatus({ id: item.id, claimStatus: newStatus }).subscribe({
      next: (res) => { this.msg(res.message, res.success ? 'success' : 'error'); if (res.success) this.load(); },
      error: (err: any) => this.msg(err.error?.message ?? 'Error', 'error')
    });
  }

  claimBadgeClass(status: string): string {
    switch (status) {
      case 'Registrado': return 'badge badge-warning';
      case 'EnRevision': return 'badge badge-info';
      case 'Aceptado': return 'badge badge-success';
      case 'Rechazado': return 'badge badge-error';
      default: return 'badge';
    }
  }

  private msg(text: string, type: 'success' | 'error'): void {
    this.message.set({ text, type });
    setTimeout(() => this.message.set(null), 4000);
  }
}
