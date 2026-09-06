import { Component, OnInit, computed, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ReportService } from '../../../core/services/finance.service';
import { StallService } from '../../../core/services/master.service';
import { AccountStatementResponse } from '../../../core/models/finance.model';
import { StallResponse } from '../../../core/models/master.model';

@Component({
  selector: 'app-account-statement',
  standalone: true,
  imports: [DatePipe, DecimalPipe, TranslocoModule, IconComponent],
  templateUrl: './account-statement.component.html',
  styleUrl: './account-statement.component.scss'
})
export class AccountStatementComponent implements OnInit {
  stalls = signal<StallResponse[]>([]);
  selectedStallId = signal<number | null>(null);
  filterDateFrom = signal('');
  filterDateTo = signal('');

  data = signal<AccountStatementResponse | null>(null);
  loading = signal(false);
  message = signal<{ text: string; type: 'success' | 'error' } | null>(null);

  readonly skeletonRows = Array.from({ length: 5 });

  activeFilterCount = computed(() =>
    [!!this.filterDateFrom(), !!this.filterDateTo()].filter(Boolean).length
  );

  paidPercent = computed(() => {
    const summary = this.data()?.summary;
    if (!summary || summary.totalDebt <= 0) return 0;
    const pct = (summary.totalPaid / summary.totalDebt) * 100;
    return Math.max(0, Math.min(100, Math.round(pct)));
  });

  /** Totales de las filas mostradas. El reporte no pagina, así que suman todo el periodo. */
  detailTotals = computed(() => (this.data()?.details ?? []).reduce(
    (acc, d) => ({
      total: acc.total + d.totalAmount,
      paid: acc.paid + d.paidAmount,
      balance: acc.balance + d.balance
    }),
    { total: 0, paid: 0, balance: 0 }
  ));

  constructor(
    private reportSvc: ReportService,
    private stallSvc: StallService
  ) {}

  ngOnInit(): void {
    this.stallSvc.list(true).subscribe({
      next: res => {
        if (!res.success) {
          this.msg(res.message || 'No se pudieron cargar los puestos', 'error');
          return;
        }

        this.stalls.set(res.data);
        if (res.data.length > 0) {
          this.selectedStallId.set(res.data[0].id);
          this.load();
        }
      },
      error: () => this.msg('No se pudieron cargar los puestos', 'error')
    });
  }

  load(): void {
    const stallId = this.selectedStallId();
    if (!stallId) {
      this.data.set(null);
      return;
    }

    this.loading.set(true);
    this.reportSvc.getAccountStatement(
      stallId,
      this.filterDateFrom() || undefined,
      this.filterDateTo() || undefined
    ).subscribe({
      next: res => {
        this.loading.set(false);
        if (!res.success) {
          this.data.set(null);
          this.msg(res.message || 'No se encontraron datos', 'error');
          return;
        }

        this.data.set(res.data);
      },
      error: () => {
        this.loading.set(false);
        this.data.set(null);
        this.msg('Error al generar el estado de cuenta', 'error');
      }
    });
  }

  onStallChange(value: string): void {
    this.selectedStallId.set(value ? +value : null);
    this.load();
  }

  clearFilters(): void {
    this.filterDateFrom.set('');
    this.filterDateTo.set('');
    this.load();
  }

  /** Porcentaje cubierto de una cuenta individual, para la barra de avance de la fila. */
  rowPercent(item: { totalAmount: number; paidAmount: number }): number {
    if (item.totalAmount <= 0) return 0;
    return Math.min(100, Math.round((item.paidAmount / item.totalAmount) * 100));
  }

  /** Vencida = fecha pasada con saldo abierto. Se compara a medianoche. */
  isOverdue(item: { dueDate?: string; balance: number }): boolean {
    if (item.balance <= 0.01 || !item.dueDate) return false;
    const due = new Date(item.dueDate);
    if (isNaN(due.getTime())) return false;
    const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    return midnight(due) < midnight(new Date());
  }

  private msg(text: string, type: 'success' | 'error'): void {
    this.message.set({ text, type });
    setTimeout(() => this.message.set(null), 4000);
  }
}
