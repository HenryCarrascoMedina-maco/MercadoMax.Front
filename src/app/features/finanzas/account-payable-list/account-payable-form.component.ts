import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { AccountPayableService } from '../../../core/services/finance.service';
import { StallService, SupplierService } from '../../../core/services/master.service';
import { GuideService } from '../../../core/services/guide.service';
import {
  AccountPayableListResponse, CreateAccountPayableFromGuideRequest, GuideLineForPayable
} from '../../../core/models/finance.model';
import { StallResponse, SupplierResponse } from '../../../core/models/master.model';
import { GuideResponse } from '../../../core/models/guide.model';
import { CrudFormPageBase } from '../../../shared/base/crud-form-page.base';
import { FormPageComponent } from '../../../shared/components/form-page/form-page.component';
import { unwrapApi } from '../../../shared/utils/api-response.operators';

/**
 * Alta de una cuenta por pagar (`/nuevo`).
 *
 * La cuenta no se teclea: se deriva de la guía. Al elegir puesto y guía se
 * traen las líneas que esa guía descarga en ese puesto —producto, marca,
 * calibre, unidad y cantidad— y lo único que se rellena es el precio unitario
 * de cada una. El importe se calcula solo.
 *
 * El precio se guarda en `guide.GuideDetail.UnitPrice`, la columna que ya
 * existía para el precio de mercadería (distinta de `TransportUnitPrice`, que
 * es el flete). Así el precio acordado queda también visible en la guía.
 *
 * El total que se ve aquí es solo para el usuario: quien manda es el que
 * calcula el backend sobre las cantidades de la guía. Enviarlo desde el cliente
 * permitiría guardar una cuenta cuyo importe no cuadra con su detalle.
 */
@Component({
  selector: 'app-account-payable-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoModule, FormPageComponent],
  templateUrl: './account-payable-form.component.html',
  styleUrl: './account-payable-form.component.scss'
})
export class AccountPayableFormComponent
  extends CrudFormPageBase<AccountPayableListResponse>
  implements OnInit {

  private readonly apSvc = inject(AccountPayableService);
  private readonly stallSvc = inject(StallService);
  private readonly supplierSvc = inject(SupplierService);
  private readonly guideSvc = inject(GuideService);
  private readonly fb = inject(FormBuilder);

  protected readonly listPath = '/account-payables';

  readonly stalls = signal<StallResponse[]>([]);
  readonly suppliers = signal<SupplierResponse[]>([]);
  readonly supplierGuides = signal<GuideResponse[]>([]);

  /** Líneas traídas de la guía, en el mismo orden que el FormArray. */
  readonly lines = signal<GuideLineForPayable[]>([]);
  readonly loadingLines = signal(false);
  /** Se consultó la guía y no trae nada para ese puesto. */
  readonly noLines = signal(false);

  /** Precios tecleados, para recalcular el total en cada pulsación. */
  private readonly priceValues = signal<number[]>([]);

  readonly subtotals = computed(() => {
    const prices = this.priceValues();
    return this.lines().map((l, i) => l.quantity * (prices[i] ?? 0));
  });

  readonly total = computed(() => this.subtotals().reduce((acc, n) => acc + n, 0));

  ngOnInit(): void {
    this.initPage();
  }

  protected override buildForm(): FormGroup {
    return this.fb.group({
      stallId: [null, Validators.required],
      supplierId: [null, Validators.required],
      guideId: [null, Validators.required],
      dueDate: [''],
      prices: this.fb.array([])
    });
  }

  get prices(): FormArray {
    return this.form?.get('prices') as FormArray;
  }

  protected override loadLookups(): void {
    this.stallSvc.list(true).subscribe((res) => { if (res.success) this.stalls.set(res.data); });
    this.supplierSvc.list(true).subscribe((res) => { if (res.success) this.suppliers.set(res.data); });
  }

  /** Las guías dependen del proveedor: no tiene sentido listarlas todas. */
  onSupplierChange(supplierId: string): void {
    this.form?.patchValue({ guideId: null });
    this.clearLines();
    if (!supplierId) { this.supplierGuides.set([]); return; }
    this.guideSvc.listBySupplier(+supplierId).subscribe((res) => {
      if (res.success) this.supplierGuides.set(res.data);
    });
  }

  /** Cambiar de puesto cambia el reparto: las líneas se vuelven a pedir. */
  onStallChange(): void { this.loadLines(); }
  onGuideChange(): void { this.loadLines(); }

  /**
   * Trae lo que la guía descarga en ese puesto. Hacen falta los dos datos: una
   * misma guía reparte a varios puestos y cada uno paga solo lo suyo.
   */
  private loadLines(): void {
    const guideId = this.form?.get('guideId')?.value;
    const stallId = this.form?.get('stallId')?.value;
    if (!guideId || !stallId) { this.clearLines(); return; }

    this.loadingLines.set(true);
    this.noLines.set(false);
    this.apSvc.guideLines(+guideId, +stallId).subscribe({
      next: (res) => {
        this.loadingLines.set(false);
        const rows = res.success ? res.data : [];
        this.setLines(rows);
        this.noLines.set(rows.length === 0);
      },
      error: (err) => { this.loadingLines.set(false); this.clearLines(); this.showError(err); }
    });
  }

  private setLines(rows: GuideLineForPayable[]): void {
    this.lines.set(rows);
    this.prices.clear();
    // El precio que ya trae la guía se propone; si es 0 se deja vacío para que
    // se note que falta ponerlo.
    for (const row of rows) {
      this.prices.push(this.fb.control(row.unitPrice || null, [Validators.required, Validators.min(0)]));
    }
    this.syncPrices();
  }

  private clearLines(): void {
    this.lines.set([]);
    this.prices.clear();
    this.priceValues.set([]);
    this.noLines.set(false);
  }

  /** Cada pulsación en un precio recalcula subtotales y total. */
  syncPrices(): void {
    this.priceValues.set(this.prices.controls.map((c) => Number(c.value) || 0));
  }

  protected override persist(v: any): Observable<unknown> {
    const req: CreateAccountPayableFromGuideRequest = {
      stallId: +v.stallId,
      supplierId: +v.supplierId,
      guideId: +v.guideId,
      dueDate: v.dueDate || undefined,
      lines: this.lines().map((l, i) => ({
        guideDetailId: l.guideDetailId,
        unitPrice: Number(v.prices[i]) || 0
      }))
    };
    return unwrapApi(this.apSvc.createFromGuide(req));
  }
}
