import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, map } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { SaleService } from '../../../core/services/finance.service';
import { ProductService, BrandService, LogisticUnitService } from '../../../core/services/master.service';
import {
  SaleHeaderResponse, SaleDetailResponse, CreateSaleDetailRequest
} from '../../../core/models/finance.model';
import { ProductResponse, BrandResponse, LogisticUnitResponse } from '../../../core/models/master.model';
import { CrudFormPageBase } from '../../../shared/base/crud-form-page.base';
import { FormPageComponent } from '../../../shared/components/form-page/form-page.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';

/**
 * Comprobante de venta. Sirve a dos rutas con la misma plantilla, igual que antes
 * el modal servía a "ver" y "gestionar" con un flag:
 *
 *   `/:id`         → solo lectura
 *   `/:id/editar`  → añade líneas y permite anular
 */
@Component({
  selector: 'app-sale-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule, DatePipe, DecimalPipe, TranslocoModule,
    FormPageComponent, ConfirmDialogComponent, IconComponent, HasPermissionDirective
  ],
  templateUrl: './sale-detail.component.html',
  styleUrl: './sale-detail.component.scss'
})
export class SaleDetailComponent extends CrudFormPageBase<SaleHeaderResponse> implements OnInit {
  private readonly saleSvc = inject(SaleService);
  private readonly productSvc = inject(ProductService);
  private readonly brandSvc = inject(BrandService);
  private readonly luSvc = inject(LogisticUnitService);
  private readonly fb = inject(FormBuilder);

  protected readonly listPath = '/sales';

  readonly details = signal<SaleDetailResponse[]>([]);
  readonly products = signal<ProductResponse[]>([]);
  readonly brands = signal<BrandResponse[]>([]);
  readonly logisticUnits = signal<LogisticUnitResponse[]>([]);

  readonly pendingVoid = signal<{ id: number } | null>(null);

  readonly detailsTotal = computed(() =>
    this.details().reduce((acc, d) => acc + d.subtotal, 0)
  );

  detailForm!: FormGroup;

  ngOnInit(): void {
    this.detailForm = this.fb.group({
      productId: [null, Validators.required],
      brandId: [null],
      productSizeId: [null],
      logisticUnitId: [null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.01)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]]
    });
    this.initPage();
  }

  /** Los catálogos solo hacen falta para dar de alta líneas. */
  protected override loadLookups(): void {
    if (this.isView()) return;
    this.productSvc.list(true).subscribe((res) => { if (res.success) this.products.set(res.data); });
    this.brandSvc.list(true).subscribe((res) => { if (res.success) this.brands.set(res.data); });
    this.luSvc.list(true).subscribe((res) => { if (res.success) this.logisticUnits.set(res.data); });
  }

  protected override fetchById(id: number): Observable<SaleHeaderResponse | null> {
    return this.saleSvc.getById(id).pipe(
      map((res) => {
        if (!res?.success || !res.data) return null;
        this.details.set(res.data.details ?? []);
        return res.data.header;
      })
    );
  }

  isCompleted(): boolean { return this.record()?.saleStatus === 'Completed'; }
  isVoided(): boolean { return this.record()?.saleStatus === 'Voided'; }

  private refresh(): void {
    const id = this.recordId();
    if (id === null) return;
    this.fetchById(id).subscribe((header) => { if (header) this.record.set(header); });
  }

  addDetail(): void {
    if (this.detailForm.invalid) { this.detailForm.markAllAsTouched(); return; }
    const header = this.record();
    if (!header) return;

    const req: CreateSaleDetailRequest = {
      saleId: header.id,
      productId: +this.detailForm.value.productId,
      brandId: this.detailForm.value.brandId ? +this.detailForm.value.brandId : undefined,
      productSizeId: this.detailForm.value.productSizeId ? +this.detailForm.value.productSizeId : undefined,
      logisticUnitId: +this.detailForm.value.logisticUnitId,
      quantity: +this.detailForm.value.quantity,
      unitPrice: +this.detailForm.value.unitPrice
    };
    this.saleSvc.createDetail(req).subscribe({
      next: (res) => {
        if (!res.success) { this.message.set({ text: res.message, type: 'error' }); return; }
        this.detailForm.reset({ quantity: 1, unitPrice: 0 });
        this.refresh();
      },
      error: (err) => this.showError(err)
    });
  }

  // ── Anulación ───────────────────────────────────────────
  // La baja de un comprobante es lógica: el backend no expone borrado físico.

  askVoid(): void {
    const header = this.record();
    if (header) this.pendingVoid.set({ id: header.id });
  }

  cancelVoid(): void { this.pendingVoid.set(null); }

  confirmVoid(): void {
    const target = this.pendingVoid();
    if (!target) return;
    this.pendingVoid.set(null);
    this.saleSvc.void(target.id).subscribe({
      next: (res) => {
        if (!res.success) { this.message.set({ text: res.message, type: 'error' }); return; }
        this.flash.set(this.transloco.translate('salesPage.voidedOk'));
        this.goToList();
      },
      error: (err) => this.showError(err)
    });
  }
}
