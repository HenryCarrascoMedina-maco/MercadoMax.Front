import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { SettlementService, CarrierService } from '../../../core/services/transport.service';
import { SettlementListResponse, CarrierResponse } from '../../../core/models/transport.model';
import { FlashService } from '../../../core/services/flash.service';

const LIST_PATH = '/settlements';

@Component({
  selector: 'app-settlement-list',
  standalone: true,
  imports: [DatePipe, DecimalPipe, TranslocoModule, PaginationComponent],
  templateUrl: './settlement-list.component.html',
  styleUrl: './settlement-list.component.scss'
})
export class SettlementListComponent implements OnInit {
  items = signal<SettlementListResponse[]>([]);
  totalRecords = signal(0);
  loading = signal(false);
  pageSize = signal(10);
  currentPage = signal(1);

  filterStatus = signal('');
  filterCarrierId = signal<number | null>(null);
  filterDateFrom = signal('');
  filterDateTo = signal('');

  /** Solo para el desplegable de filtro; el alta vive en su propia página. */
  carriers = signal<CarrierResponse[]>([]);

  /** Cuántos filtros están puestos: alimenta el contador y habilita "Limpiar". */
  activeFilterCount = computed(() =>
    [
      !!this.filterStatus(),
      this.filterCarrierId() !== null,
      !!this.filterDateFrom(),
      !!this.filterDateTo()
    ].filter(Boolean).length
  );

  /** Filas y celdas fantasma mientras carga, para que la tabla no salte de alto. */
  readonly skeletonRows = Array.from({ length: 6 });
  readonly skeletonCells = Array.from({ length: 8 });

  message = signal<{ text: string; type: 'success' | 'error' } | null>(null);

  private readonly router = inject(Router);
  private readonly flash = inject(FlashService);
  private readonly transloco = inject(TranslocoService);

  constructor(
    private settlementSvc: SettlementService,
    private carrierSvc: CarrierService
  ) {}

  ngOnInit(): void {
    const pending = this.flash.consume();
    if (pending) this.msg(pending.text, pending.type);
    this.carrierSvc.list(true).subscribe(res => { if (res.success) this.carriers.set(res.data); });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.settlementSvc.list(
      this.filterStatus() || undefined,
      this.filterCarrierId() ?? undefined,
      this.filterDateFrom() || undefined,
      this.filterDateTo() || undefined,
      this.currentPage(),
      this.pageSize()
    ).subscribe({
      next: res => {
        this.loading.set(false);
        this.items.set(res.data);
        this.totalRecords.set(res.totalRecords);
      },
      error: () => this.loading.set(false)
    });
  }

  applyFilters(): void { this.currentPage.set(1); this.load(); }

  clearFilters(): void {
    this.filterStatus.set('');
    this.filterCarrierId.set(null);
    this.filterDateFrom.set('');
    this.filterDateTo.set('');
    this.applyFilters();
  }

  goCreate(): void { this.router.navigate([LIST_PATH, 'nuevo']); }
  goView(item: SettlementListResponse): void { this.router.navigate([LIST_PATH, item.id]); }

  /**
   * Solo se ofrece sobre liquidaciones pendientes. El aviso nombra el registro y
   * dice cuántas líneas se lleva por delante, porque el borrado es definitivo:
   * una pendiente nunca movió dinero, así que se borra en vez de quedar como
   * baja lógica.
   */
  deleteSettlement(item: SettlementListResponse): void {
    const question = this.transloco.translate('settlements.deleteConfirm', {
      id: item.id,
      carrier: item.carrierName,
      lines: item.detailCount
    });
    if (!confirm(question)) return;

    this.settlementSvc.delete(item.id).subscribe({
      next: (res) => {
        this.msg(res.message, res.success ? 'success' : 'error');
        if (res.success) this.load();
      },
      error: (err: any) => this.msg(err.error?.message ?? this.transloco.translate('common.unexpectedError'), 'error')
    });
  }

  onPageChange(page: number): void { this.currentPage.set(page); this.load(); }
  onPageSizeChange(size: number): void { this.pageSize.set(size); this.currentPage.set(1); this.load(); }

  private msg(text: string, type: 'success' | 'error'): void {
    this.message.set({ text, type });
    setTimeout(() => this.message.set(null), 4000);
  }
}
