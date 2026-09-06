import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { ReceptionConfirmationService } from '../../../core/services/merchant.service';
import { StallService } from '../../../core/services/master.service';
import { ReceptionConfirmationResponse, CreateReceptionConfirmationRequest } from '../../../core/models/merchant.model';
import { StallResponse } from '../../../core/models/master.model';
import { AuthService } from '../../../core/services/auth.service';
import { FlashService } from '../../../core/services/flash.service';

const LIST_PATH = '/reception-confirmations';

@Component({
  selector: 'app-reception-confirmation-list',
  standalone: true,
  imports: [
    DatePipe, TranslocoModule,
    PaginationComponent, IconComponent, HasPermissionDirective
  ],
  templateUrl: './reception-confirmation-list.component.html',
  styleUrl: './reception-confirmation-list.component.scss'
})
export class ReceptionConfirmationListComponent implements OnInit {
  items = signal<ReceptionConfirmationResponse[]>([]);
  loading = signal(false);
  pageSize = signal(10);
  currentPage = signal(1);

  stalls = signal<StallResponse[]>([]);
  selectedStallId = signal<number | null>(null);
  filterDateFrom = signal('');
  filterDateTo = signal('');

  message = signal<{ text: string; type: 'success' | 'error' } | null>(null);

  readonly skeletonRows = Array.from({ length: 6 });

  activeFilterCount = computed(() =>
    [!!this.filterDateFrom(), !!this.filterDateTo()].filter(Boolean).length
  );

  /** El servicio devuelve la lista completa; la paginación es en cliente. */
  pagedItems = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.items().slice(start, start + this.pageSize());
  });

  private readonly router = inject(Router);
  private readonly flash = inject(FlashService);

  constructor(
    private svc: ReceptionConfirmationService,
    private stallSvc: StallService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    const pending = this.flash.consume();
    if (pending) this.msg(pending.text, pending.type);
    this.stallSvc.list().subscribe(res => {
      if (res.success) this.stalls.set(res.data);
    });
  }

  load(): void {
    const stallId = this.selectedStallId();
    if (!stallId) return;
    this.loading.set(true);
    this.currentPage.set(1);
    this.svc.listByStall(
      stallId,
      this.filterDateFrom() || undefined,
      this.filterDateTo() || undefined
    ).subscribe({
      next: res => { this.loading.set(false); if (res.success) this.items.set(res.data); },
      error: () => this.loading.set(false)
    });
  }

  onStallChange(stallId: string): void {
    this.selectedStallId.set(stallId ? +stallId : null);
    if (stallId) this.load();
    else this.items.set([]);
  }

  applyFilters(): void { this.load(); }

  clearFilters(): void {
    this.filterDateFrom.set('');
    this.filterDateTo.set('');
    this.load();
  }

  /** Lleva el puesto elegido al formulario para no re-seleccionarlo. */
  goCreate(): void {
    const stallId = this.selectedStallId();
    this.router.navigate([LIST_PATH, 'nuevo'], { queryParams: stallId ? { stallId } : {} });
  }

  onPageChange(page: number): void { this.currentPage.set(page); }
  onPageSizeChange(size: number): void { this.pageSize.set(size); this.currentPage.set(1); }

  private msg(text: string, type: 'success' | 'error'): void {
    this.message.set({ text, type });
    setTimeout(() => this.message.set(null), 4000);
  }
}
