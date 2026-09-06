import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { AccountPayableService } from '../../../core/services/finance.service';
import { StallService, SupplierService } from '../../../core/services/master.service';
import { AccountPayableListResponse } from '../../../core/models/finance.model';
import { StallResponse, SupplierResponse } from '../../../core/models/master.model';
import { FlashService } from '../../../core/services/flash.service';

const LIST_PATH = '/account-payables';

@Component({
  selector: 'app-account-payable-list',
  standalone: true,
  imports: [
    DatePipe, DecimalPipe, TranslocoModule,
    PaginationComponent, IconComponent, HasPermissionDirective
  ],
  templateUrl: './account-payable-list.component.html',
  styleUrl: './account-payable-list.component.scss'
})
export class AccountPayableListComponent implements OnInit {
  items = signal<AccountPayableListResponse[]>([]);
  totalRecords = signal(0);
  loading = signal(false);
  pageSize = signal(10);
  currentPage = signal(1);

  filterStallId = signal<number | null>(null);
  filterSupplierId = signal<number | null>(null);
  filterAccountStatus = signal('');
  filterDateFrom = signal('');
  filterDateTo = signal('');
  filterSearch = signal('');

  activeFilterCount = computed(() =>
    [
      this.filterStallId() !== null,
      this.filterSupplierId() !== null,
      !!this.filterAccountStatus(),
      !!this.filterDateFrom(),
      !!this.filterDateTo(),
      !!this.filterSearch()
    ].filter(Boolean).length
  );

  /** Totales de la página visible. El API pagina: no son los totales del filtro completo. */
  pageTotals = computed(() => this.items().reduce(
    (acc, i) => ({
      total: acc.total + i.totalAmount,
      paid: acc.paid + i.paidAmount,
      balance: acc.balance + i.balance
    }),
    { total: 0, paid: 0, balance: 0 }
  ));

  readonly skeletonRows = Array.from({ length: 6 });

  /** Solo para los desplegables de filtro. */
  stalls = signal<StallResponse[]>([]);
  suppliers = signal<SupplierResponse[]>([]);

  message = signal<{ text: string; type: 'success' | 'error' } | null>(null);

  private readonly router = inject(Router);
  private readonly flash = inject(FlashService);

  constructor(
    private apSvc: AccountPayableService,
    private stallSvc: StallService,
    private supplierSvc: SupplierService
  ) {}

  ngOnInit(): void {
    const pending = this.flash.consume();
    if (pending) this.msg(pending.text, pending.type);
    this.stallSvc.list(true).subscribe(res => { if (res.success) this.stalls.set(res.data); });
    this.supplierSvc.list(true).subscribe(res => { if (res.success) this.suppliers.set(res.data); });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.apSvc.list(
      this.filterStallId() ?? undefined,
      this.filterSupplierId() ?? undefined,
      this.filterAccountStatus() || undefined,
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
    this.filterSupplierId.set(null);
    this.filterAccountStatus.set('');
    this.filterDateFrom.set('');
    this.filterDateTo.set('');
    this.filterSearch.set('');
    this.applyFilters();
  }

  onPageChange(page: number): void { this.currentPage.set(page); this.load(); }
  onPageSizeChange(size: number): void { this.pageSize.set(size); this.currentPage.set(1); this.load(); }

  // ── Ayudas de presentación ──────────────────────────────

  /** Porcentaje pagado, para la barra de avance. */
  paidPercent(item: { totalAmount: number; paidAmount: number }): number {
    if (item.totalAmount <= 0) return 0;
    return Math.min(100, Math.round((item.paidAmount / item.totalAmount) * 100));
  }

  /**
   * Días hasta el vencimiento: negativo si ya venció, null si no hay fecha.
   * Se compara a medianoche para que "hoy" no dependa de la hora.
   */
  daysToDue(dueDate?: string): number | null {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    if (isNaN(due.getTime())) return null;
    const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    return Math.round((midnight(due) - midnight(new Date())) / 86_400_000);
  }

  /**
   * Etiqueta de vencimiento lista para i18n, o null si no se puede calcular.
   * Se devuelve como objeto y no como número porque en el template `@if (0; as d)`
   * caería en el `@else` — "vence hoy" funcionaría por accidente y una fecha
   * inválida mostraría ese mismo texto siendo falso.
   */
  dueInfo(dueDate?: string): { key: 'overdueBy' | 'dueToday' | 'dueIn'; days: number } | null {
    const d = this.daysToDue(dueDate);
    if (d === null) return null;
    if (d === 0) return { key: 'dueToday', days: 0 };
    return d < 0 ? { key: 'overdueBy', days: -d } : { key: 'dueIn', days: d };
  }

  /** Una cuenta vencida y no pagada es el dato que el usuario necesita ver primero. */
  isOverdue(item: { dueDate?: string; accountStatus: string }): boolean {
    if (item.accountStatus === 'Paid') return false;
    const d = this.daysToDue(item.dueDate);
    return d !== null && d < 0;
  }

  goCreate(): void { this.router.navigate([LIST_PATH, 'nuevo']); }
  goView(item: AccountPayableListResponse): void { this.router.navigate([LIST_PATH, item.id]); }
  goEdit(item: AccountPayableListResponse): void { this.router.navigate([LIST_PATH, item.id, 'editar']); }

  private msg(text: string, type: 'success' | 'error'): void {
    this.message.set({ text, type });
    setTimeout(() => this.message.set(null), 4000);
  }
}
