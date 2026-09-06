import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { SaleService } from '../../../core/services/finance.service';
import { StallService } from '../../../core/services/master.service';
import { SaleListResponse } from '../../../core/models/finance.model';
import { StallResponse } from '../../../core/models/master.model';
import { FlashService } from '../../../core/services/flash.service';

/** Presets del selector de rango rápido de fechas. */
type QuickRange = 'today' | 'last7' | 'month' | 'all';

const LIST_PATH = '/sales';

@Component({
  selector: 'app-sale-list',
  standalone: true,
  imports: [
    DatePipe, DecimalPipe, TranslocoModule,
    PaginationComponent, ConfirmDialogComponent, IconComponent, HasPermissionDirective
  ],
  templateUrl: './sale-list.component.html',
  styleUrl: './sale-list.component.scss'
})
export class SaleListComponent implements OnInit {
  items = signal<SaleListResponse[]>([]);
  totalRecords = signal(0);
  loading = signal(false);
  pageSize = signal(10);
  currentPage = signal(1);

  filterStallId = signal<number | null>(null);
  filterPaymentType = signal('');
  filterSaleStatus = signal('');
  filterDateFrom = signal('');
  filterDateTo = signal('');
  filterSearch = signal('');
  quickRange = signal<QuickRange>('all');

  /** Cuántos filtros están aplicados: alimenta el contador y habilita "Limpiar". */
  activeFilterCount = computed(() =>
    [
      this.filterStallId() !== null,
      !!this.filterPaymentType(),
      !!this.filterSaleStatus(),
      !!this.filterDateFrom(),
      !!this.filterDateTo(),
      !!this.filterSearch()
    ].filter(Boolean).length
  );

  /** Suma de la página visible. No es el total del filtro completo: el API pagina. */
  pageTotal = computed(() => this.items().reduce((acc, i) => acc + i.totalAmount, 0));

  /** Filas fantasma mientras carga, para que la tabla no salte de alto. */
  readonly skeletonRows = Array.from({ length: 6 });

  /** Venta pendiente de confirmación de anulación (acción "eliminar"). */
  pendingVoid = signal<{ id: number } | null>(null);

  /** Solo para el desplegable de filtro por puesto. */
  stalls = signal<StallResponse[]>([]);

  message = signal<{ text: string; type: 'success' | 'error' } | null>(null);

  private readonly router = inject(Router);
  private readonly flash = inject(FlashService);

  constructor(
    private saleSvc: SaleService,
    private stallSvc: StallService
  ) {}

  ngOnInit(): void {
    const pending = this.flash.consume();
    if (pending) this.msg(pending.text, pending.type);
    this.stallSvc.list(true).subscribe(res => { if (res.success) this.stalls.set(res.data); });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.saleSvc.list(
      this.filterStallId() ?? undefined,
      this.filterPaymentType() || undefined,
      this.filterSaleStatus() || undefined,
      this.filterDateFrom() || undefined,
      this.filterDateTo() || undefined,
      this.filterSearch() || undefined,
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
    this.filterStallId.set(null);
    this.filterPaymentType.set('');
    this.filterSaleStatus.set('');
    this.filterDateFrom.set('');
    this.filterDateTo.set('');
    this.filterSearch.set('');
    this.quickRange.set('all');
    this.applyFilters();
  }

  // ── Rango rápido de fechas ──────────────────────────────
  setQuickRange(range: QuickRange): void {
    this.quickRange.set(range);
    if (range === 'all') {
      this.filterDateFrom.set('');
      this.filterDateTo.set('');
    } else {
      const today = new Date();
      const from = new Date(today);
      if (range === 'last7') from.setDate(today.getDate() - 6);
      if (range === 'month') from.setDate(1);
      this.filterDateFrom.set(this.toInputDate(from));
      this.filterDateTo.set(this.toInputDate(today));
    }
    this.applyFilters();
  }

  /** Un cambio manual de fecha desactiva el preset activo. */
  onDateChange(which: 'from' | 'to', value: string): void {
    (which === 'from' ? this.filterDateFrom : this.filterDateTo).set(value);
    this.quickRange.set('all');
    this.applyFilters();
  }

  private toInputDate(d: Date): string {
    const p = (n: number) => `${n}`.padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }

  onPageChange(page: number): void { this.currentPage.set(page); this.load(); }
  onPageSizeChange(size: number): void { this.pageSize.set(size); this.currentPage.set(1); this.load(); }

  goCreate(): void { this.router.navigate([LIST_PATH, 'nuevo']); }
  goView(item: SaleListResponse): void { this.router.navigate([LIST_PATH, item.id]); }
  goEdit(item: SaleListResponse): void { this.router.navigate([LIST_PATH, item.id, 'editar']); }

  /**
   * Acción "eliminar": pide confirmación. En ventas la baja es lógica (anulación),
   * porque el backend no expone borrado físico de un comprobante.
   */
  askVoid(sale: { id: number }): void { this.pendingVoid.set({ id: sale.id }); }
  cancelVoid(): void { this.pendingVoid.set(null); }

  confirmVoid(): void {
    const target = this.pendingVoid();
    if (!target) return;
    this.pendingVoid.set(null);
    this.saleSvc.void(target.id).subscribe({
      next: res => {
        this.msg(res.message, res.success ? 'success' : 'error');
        if (res.success) this.load();
      },
      error: (err: any) => this.msg(err.error?.message ?? 'Error al anular', 'error')
    });
  }

  private msg(text: string, type: 'success' | 'error'): void {
    this.message.set({ text, type });
    setTimeout(() => this.message.set(null), 4000);
  }
}
