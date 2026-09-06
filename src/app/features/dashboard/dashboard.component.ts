import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { TranslocoModule } from '@jsverse/transloco';
import { TranslocoService } from '@jsverse/transloco';
import { DashboardBundle, DashboardMetric, DashboardSection, DashboardTableColumn } from '../../core/models/dashboard.model';
import { DashboardService } from '../../core/services/dashboard.service';
import { ExportSection, ExportService } from '../../core/services/export.service';
import { RoleNamePipe } from '../../shared/pipes/role-name.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [TranslocoModule, DatePipe, RoleNamePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  readonly bundle = signal<DashboardBundle | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');

  constructor(
    public auth: AuthService,
    private readonly dashboardService: DashboardService,
    private readonly exportService: ExportService,
    private readonly translocoService: TranslocoService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const user = this.auth.user();
    if (!user) {
      this.error.set('No user session found');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.dashboardService.loadDashboard(user).subscribe({
      next: bundle => {
        this.bundle.set(bundle);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load dashboard');
        this.loading.set(false);
      }
    });
  }

  async exportExcel(section: DashboardSection): Promise<void> {
    const payload = this.toExportSection(section);
    await this.exportService.exportSectionToExcel(payload, `${this.fileName(section.roleKey)}.xlsx`);
  }

  async exportPdf(section: DashboardSection): Promise<void> {
    const payload = this.toExportSection(section);
    await this.exportService.exportSectionToPdf(payload, `${this.fileName(section.roleKey)}.pdf`);
  }

  formatMetric(metric: DashboardMetric): string {
    return this.formatValue(metric.value, metric.format);
  }

  formatDisplay(value: string | number, format: DashboardMetric['format'] = 'text'): string {
    return this.formatValue(value, format);
  }

  formatCell(column: DashboardTableColumn, value: string | number | null | undefined): string {
    return this.formatValue(value ?? '', column.format);
  }

  private formatValue(value: string | number, format: DashboardMetric['format'] = 'text'): string {
    if (format === 'currency' && typeof value === 'number') {
      return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (format === 'number' && typeof value === 'number') {
      return value.toLocaleString('es-PE');
    }
    return `${value}`;
  }

  private toExportSection(section: DashboardSection): ExportSection {
    return {
      title: this.translocoService.translate(section.titleKey),
      subtitle: this.translocoService.translate(section.subtitleKey),
      metrics: section.metrics.map(metric => ({
        label: this.translocoService.translate(metric.labelKey),
        value: this.formatMetric(metric)
      })),
      table: section.table ? {
        title: this.translocoService.translate(section.table.titleKey),
        columns: section.table.columns.map(column => ({
          key: column.key,
          label: this.translocoService.translate(column.labelKey)
        })),
        rows: section.table.rows.map(row => {
          const result: Record<string, string> = {};
          for (const column of section.table!.columns) {
            result[column.key] = this.formatCell(column, row[column.key]);
          }
          return result;
        })
      } : undefined
    };
  }

  private fileName(roleKey: string): string {
    const stamp = new Date().toISOString().slice(0, 10);
    return `dashboard-${roleKey}-${stamp}`;
  }
}
