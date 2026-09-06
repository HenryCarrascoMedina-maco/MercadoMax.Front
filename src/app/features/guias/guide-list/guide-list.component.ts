import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { GuideService } from '../../../core/services/guide.service';
import { GuideResponse } from '../../../core/models/guide.model';
import { FlashService } from '../../../core/services/flash.service';

const LIST_PATH = '/guides';

@Component({
  selector: 'app-guide-list',
  standalone: true,
  imports: [DatePipe, TranslocoModule],
  templateUrl: './guide-list.component.html',
  styleUrl: './guide-list.component.scss'
})
export class GuideListComponent implements OnInit {
  // List state
  items = signal<GuideResponse[]>([]);
  loading = signal(false);
  totalRecords = signal(0);
  pageNumber = signal(1);
  pageSize = signal(10);
  filterStatus = signal('');
  message = signal<{ text: string; type: 'success' | 'error' } | null>(null);

  private readonly router = inject(Router);
  private readonly flash = inject(FlashService);

  constructor(private svc: GuideService) {}

  ngOnInit(): void {
    const pending = this.flash.consume();
    if (pending) this.msg(pending.text, pending.type);
    this.load();
  }

  // ── List ────────────────────────────────────────────────

  load(): void {
    this.loading.set(true);
    const status = this.filterStatus() || undefined;
    this.svc.list(status, undefined, undefined, this.pageNumber(), this.pageSize()).subscribe({
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
    if (this.pageNumber() > 1) { this.pageNumber.update(p => p - 1); this.load(); }
  }

  nextPage(): void {
    if (this.pageNumber() * this.pageSize() < this.totalRecords()) { this.pageNumber.update(p => p + 1); this.load(); }
  }

  goCreate(): void { this.router.navigate([LIST_PATH, 'nuevo']); }
  goView(item: GuideResponse): void { this.router.navigate([LIST_PATH, item.id]); }
  goEdit(item: GuideResponse): void { this.router.navigate([LIST_PATH, item.id, 'editar']); }

  // ── Status ─────────────────────────────────────────────

  updateStatus(item: GuideResponse, newStatus: string): void {
    this.svc.updateStatus({ id: item.id, guideStatus: newStatus }).subscribe({
      next: (res) => { this.msg(res.message, res.success ? 'success' : 'error'); if (res.success) this.load(); },
      error: (err: any) => this.msg(err.error?.message ?? 'Error', 'error')
    });
  }

  voidGuide(item: GuideResponse): void {
    if (!confirm(`¿Anular la guía "${item.guideNumber}"?`)) return;
    this.svc.void(item.id).subscribe({
      next: (res) => { this.msg(res.message, res.success ? 'success' : 'error'); if (res.success) this.load(); },
      error: (err: any) => this.msg(err.error?.message ?? 'Error', 'error')
    });
  }

  statusBadgeClass(status: string): string {
    switch (status) {
      case 'Pending':       return 'badge-info';
      case 'InTransit':     return 'badge-warning';
      case 'Received':      return 'badge-active';
      case 'WithShortages': return 'badge-warning';
      case 'Closed':        return 'badge-active';
      case 'Voided':        return 'badge-inactive';
      default: return '';
    }
  }

  private msg(text: string, type: 'success' | 'error'): void {
    this.message.set({ text, type });
    setTimeout(() => this.message.set(null), 4000);
  }
}

