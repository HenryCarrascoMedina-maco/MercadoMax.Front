import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { InventoryMovementService, InventoryService } from '../../../core/services/merchant.service';
import { InventoryMovementResponse, InventoryResponse } from '../../../core/models/merchant.model';
import { AuthService } from '../../../core/services/auth.service';
import { FlashService } from '../../../core/services/flash.service';

const LIST_PATH = '/inventory-movements';

@Component({
  selector: 'app-inventory-movement-list',
  standalone: true,
  imports: [
    DatePipe, DecimalPipe, TranslocoModule,
    PaginationComponent, IconComponent, HasPermissionDirective
  ],
  templateUrl: './inventory-movement-list.component.html',
  styleUrl: './inventory-movement-list.component.scss'
})
export class InventoryMovementListComponent implements OnInit {
  items = signal<InventoryMovementResponse[]>([]);
  totalItems = signal(0);
  loading = signal(false);
  pageSize = signal(10);
  currentPage = signal(1);

  inventoryList = signal<InventoryResponse[]>([]);
  selectedInventoryId = signal<number | null>(null);
  filterDateFrom = signal('');
  filterDateTo = signal('');

  /** El inventario elegido da el contexto del kardex: producto, unidad y stock actual. */
  selectedInventory = computed(() =>
    this.inventoryList().find(i => i.id === this.selectedInventoryId()) ?? null
  );

  activeFilterCount = computed(() =>
    [!!this.filterDateFrom(), !!this.filterDateTo()].filter(Boolean).length
  );

  /** Neto de la página: las salidas restan. Es el efecto real sobre el stock. */
  pageNet = computed(() =>
    this.items().reduce((acc, m) => acc + this.signedQuantity(m), 0)
  );

  readonly skeletonRows = Array.from({ length: 6 });

  message = signal<{ text: string; type: 'success' | 'error' } | null>(null);


  private readonly router = inject(Router);
  private readonly flash = inject(FlashService);

  constructor(
    private svc: InventoryMovementService,
    private inventorySvc: InventoryService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    const pending = this.flash.consume();
    if (pending) this.msg(pending.text, pending.type);
    this.inventorySvc.list().subscribe(res => {
      if (res.success) this.inventoryList.set(res.data);
    });
  }

  load(): void {
    const inventoryId = this.selectedInventoryId();
    if (!inventoryId) return;
    this.loading.set(true);
    this.svc.listByInventory(
      inventoryId,
      this.filterDateFrom() || undefined,
      this.filterDateTo() || undefined,
      this.currentPage(),
      this.pageSize()
    ).subscribe({
      next: res => {
        this.loading.set(false);
        this.items.set(res.data);
        this.totalItems.set(res.totalRecords);
      },
      error: () => this.loading.set(false)
    });
  }

  onInventoryChange(id: string): void {
    this.selectedInventoryId.set(id ? +id : null);
    this.currentPage.set(1);
    if (id) this.load();
    else { this.items.set([]); this.totalItems.set(0); }
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.load();
  }

  clearFilters(): void {
    this.filterDateFrom.set('');
    this.filterDateTo.set('');
    this.applyFilters();
  }

  // ── Ayudas de presentación ──────────────────────────────

  /** Salida en negativo; entrada y ajuste tal cual llegan. */
  signedQuantity(item: { movementType: string; quantity: number }): number {
    return item.movementType === 'Outbound' ? -item.quantity : item.quantity;
  }

  /** Clase de color del importe y de la etiqueta de tipo. */
  typeClass(movementType: string): string {
    if (movementType === 'Inbound') return 'in';
    if (movementType === 'Outbound') return 'out';
    return 'adj';
  }

  /** Lleva el inventario elegido al formulario para no re-seleccionarlo. */
  goCreate(): void {
    const inventoryId = this.selectedInventoryId();
    this.router.navigate([LIST_PATH, 'nuevo'], {
      queryParams: inventoryId ? { inventoryId } : {}
    });
  }

  onPageChange(page: number): void { this.currentPage.set(page); this.load(); }
  onPageSizeChange(size: number): void { this.pageSize.set(size); this.currentPage.set(1); this.load(); }

  private msg(text: string, type: 'success' | 'error'): void {
    this.message.set({ text, type });
    setTimeout(() => this.message.set(null), 4000);
  }
}
