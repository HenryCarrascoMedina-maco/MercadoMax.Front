import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, map } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { GuideService, GuideDetailService } from '../../../core/services/guide.service';
import { TransportRateService, TruckService } from '../../../core/services/transport.service';
import {
  ProductService, BrandService, ProductSizeService, LogisticUnitService, StallService
} from '../../../core/services/master.service';
import {
  GuideHeaderResponse, GuideDetailResponse, CreateGuideDetailRequest
} from '../../../core/models/guide.model';
import { TransportRateResponse, TruckResponse } from '../../../core/models/transport.model';
import {
  ProductResponse, BrandResponse, ProductSizeResponse, LogisticUnitResponse, StallResponse
} from '../../../core/models/master.model';
import { CrudFormPageBase } from '../../../shared/base/crud-form-page.base';
import { FormPageComponent } from '../../../shared/components/form-page/form-page.component';
import { Subguide, buildSubguides } from './subguide.model';

/**
 * Guía de remisión. Dos rutas, una plantilla:
 *
 *   `/:id`         → solo lectura
 *   `/:id/editar`  → paso 2 del alta: carga las líneas de la guía
 *
 * Las líneas se leen del backend en cada refresco, no de una lista en memoria
 * como hacía el wizard: así lo que se ve es lo que hay guardado.
 */
@Component({
  selector: 'app-guide-detail',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, DecimalPipe, TranslocoModule, FormPageComponent],
  templateUrl: './guide-detail.component.html',
  styleUrl: './guide-detail.component.scss'
})
export class GuideDetailComponent extends CrudFormPageBase<GuideHeaderResponse> implements OnInit {
  private readonly svc = inject(GuideService);
  private readonly detailSvc = inject(GuideDetailService);
  private readonly transportRateSvc = inject(TransportRateService);
  private readonly truckSvc = inject(TruckService);
  private readonly productSvc = inject(ProductService);
  private readonly brandSvc = inject(BrandService);
  private readonly productSizeSvc = inject(ProductSizeService);
  private readonly logisticUnitSvc = inject(LogisticUnitService);
  private readonly stallSvc = inject(StallService);
  private readonly fb = inject(FormBuilder);

  protected readonly listPath = '/guides';

  readonly details = signal<GuideDetailResponse[]>([]);

  readonly stalls = signal<StallResponse[]>([]);
  readonly products = signal<ProductResponse[]>([]);
  readonly brands = signal<BrandResponse[]>([]);
  readonly productSizes = signal<ProductSizeResponse[]>([]);
  readonly logisticUnits = signal<LogisticUnitResponse[]>([]);
  readonly transportRates = signal<TransportRateResponse[]>([]);
  readonly trucks = signal<TruckResponse[]>([]);

  readonly showAddDetailForm = signal(false);
  readonly addingDetail = signal(false);

  readonly transportTotal = computed(() =>
    this.details().reduce((acc, d) => acc + d.transportSubtotal, 0)
  );

  /**
   * Categoría a la que queda atada la guía: la de su primera línea.
   *
   * Un envío no mezcla papas con limones, así que en cuanto hay una línea el
   * resto tiene que ser de la misma categoría. Null mientras la guía está vacía:
   * ahí todavía se puede elegir cualquier producto.
   */
  readonly lockedCategory = computed<string | null>(() => {
    const first = this.details()[0];
    if (!first) return null;
    if (first.categoryName) return first.categoryName;

    // Respaldo para una base sin el script 23 aplicado, donde SP_READ_GUIDE
    // devuelve la categoría en null: se deduce del catálogo de productos.
    return this.products().find((p) => p.id === first.productId)?.categoryName ?? null;
  });

  /** Productos que se pueden añadir: los de la categoría de la guía. */
  readonly availableProducts = computed<ProductResponse[]>(() => {
    const category = this.lockedCategory();
    if (!category) return this.products();
    return this.products().filter((p) => p.categoryName === category);
  });

  // ── Carga del camión ────────────────────────────────────
  // El peso vive en la unidad logística (kg por bulto) y la capacidad en el
  // camión. Una unidad sin peso no suma: es preferible a inventar un valor,
  // pero entonces el total es incompleto y hay que decirlo.

  /** Camión de esta guía, si tiene uno asignado. */
  readonly truck = computed<TruckResponse | null>(() => {
    const truckId = this.record()?.truckId;
    return truckId ? this.trucks().find((t) => t.id === truckId) ?? null : null;
  });

  /** Capacidad del camión en kg, o null si no hay camión o no la tiene puesta. */
  readonly capacityKg = computed<number | null>(() => this.truck()?.capacityKg ?? null);

  private weightOf(logisticUnitId: number): number | null {
    return this.logisticUnits().find((u) => u.id === logisticUnitId)?.weightKg ?? null;
  }

  /** Peso ya cargado, sumando solo las líneas cuya unidad tiene peso definido. */
  readonly loadedKg = computed<number>(() =>
    this.details().reduce((acc, d) => {
      const w = this.weightOf(d.logisticUnitId);
      return acc + (w ? w * d.quantity : 0);
    }, 0)
  );

  /** Líneas cuya unidad no tiene peso: hacen que el total se quede corto. */
  readonly linesWithoutWeight = computed<number>(() =>
    this.details().filter((d) => !this.weightOf(d.logisticUnitId)).length
  );

  readonly loadPercent = computed<number>(() => {
    const cap = this.capacityKg();
    if (!cap || cap <= 0) return 0;
    return Math.round((this.loadedKg() / cap) * 100);
  });

  readonly remainingKg = computed<number>(() => {
    const cap = this.capacityKg();
    return cap ? Math.max(0, cap - this.loadedKg()) : 0;
  });

  readonly isOverloaded = computed<boolean>(() => {
    const cap = this.capacityKg();
    return !!cap && this.loadedKg() > cap;
  });

  /** Peso que añadiría la línea que se está escribiendo ahora mismo. */
  pendingLineKg(): number {
    const v = this.detailForm?.value;
    if (!v?.logisticUnitId || !v?.quantity) return 0;
    const w = this.weightOf(+v.logisticUnitId);
    return w ? w * +v.quantity : 0;
  }

  // ── Subguías ────────────────────────────────────────────

  /**
   * Las líneas agrupadas por puesto. Un camión lleva una guía y descarga una
   * subguía en cada puesto.
   */
  readonly subguides = computed<Subguide[]>(() =>
    buildSubguides(
      this.record()?.guideNumber ?? '',
      this.details(),
      (id) => this.weightOf(id)
    )
  );

  /** true si esa línea haría que la guía pase de la capacidad del camión. */
  wouldExceedCapacity(): boolean {
    const cap = this.capacityKg();
    if (!cap) return false;
    return this.loadedKg() + this.pendingLineKg() > cap;
  }

  detailForm!: FormGroup;

  ngOnInit(): void {
    this.detailForm = this.fb.group({
      destinationStallId: [null, Validators.required],
      productId: [null, Validators.required],
      brandId: [null],
      productSizeId: [null],
      logisticUnitId: [null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      // El precio del producto no se conoce al despachar: lo pone el mercado al
      // llegar. Opcional; si se deja vacío viaja como 0.
      unitPrice: [0, Validators.min(0)],
      transportUnitPrice: [0, [Validators.required, Validators.min(0)]],
      observations: ['']
    });
    this.initPage();
  }

  /** Los catálogos solo hacen falta para dar de alta líneas. */
  protected override loadLookups(): void {
    // Unidades y camiones se cargan siempre: la ocupación del camión se muestra
    // también en la ficha de solo lectura.
    this.logisticUnitSvc.list(true).subscribe((res) => { if (res.success) this.logisticUnits.set(res.data); });
    this.truckSvc.list().subscribe((res) => { if (res.success) this.trucks.set(res.data); });

    if (this.isView()) return;
    this.productSvc.list(true).subscribe((res) => { if (res.success) this.products.set(res.data); });
    this.stallSvc.list(true).subscribe((res) => { if (res.success) this.stalls.set(res.data); });
  }

  protected override fetchById(id: number): Observable<GuideHeaderResponse | null> {
    return this.svc.getById(id).pipe(
      map((res) => {
        if (!res?.success || !res.data) return null;
        this.details.set(res.data.details ?? []);
        return res.data.header;
      })
    );
  }

  /** Las tarifas dependen del transportista de la guía: prellenan el flete. */
  protected override afterRecordLoaded(row: GuideHeaderResponse): void {
    if (this.isView() || !row.carrierId) return;
    this.transportRateSvc.listByCarrier(row.carrierId).subscribe((res) => {
      if (res.success) this.transportRates.set(res.data);
    });
  }

  private refresh(): void {
    const id = this.recordId();
    if (id === null) return;
    this.fetchById(id).subscribe((header) => { if (header) this.record.set(header); });
  }

  // ── Alta de líneas ──────────────────────────────────────

  toggleAddDetailForm(): void {
    this.showAddDetailForm.update((v) => !v);
    if (this.showAddDetailForm()) this.resetDetailForm();
  }

  resetDetailForm(): void {
    this.detailForm.reset({ quantity: 1, unitPrice: 0, transportUnitPrice: 0 });
    this.brands.set([]);
    this.productSizes.set([]);
  }

  /** Marcas y calibres se acotan al producto elegido. */
  onProductChange(event: Event): void {
    const productId = +(event.target as HTMLSelectElement).value || null;
    this.detailForm.patchValue({ brandId: null, productSizeId: null });
    this.brands.set([]);
    this.productSizes.set([]);
    if (!productId) return;
    this.brandSvc.list(true, undefined, productId).subscribe((res) => {
      if (res.success) this.brands.set(res.data);
    });
    this.productSizeSvc.list(true, productId).subscribe((res) => {
      if (res.success) this.productSizes.set(res.data);
    });
  }

  /** Si hay tarifa para esa unidad, el flete se propone solo. */
  onLogisticUnitChange(event: Event): void {
    const logisticUnitId = +(event.target as HTMLSelectElement).value || null;
    if (!logisticUnitId) return;
    const rate = this.transportRates().find((r) => r.logisticUnitId === logisticUnitId);
    if (rate) this.detailForm.patchValue({ transportUnitPrice: rate.unitPrice });
  }

  saveDetail(): void {
    if (this.detailForm.invalid) { this.detailForm.markAllAsTouched(); return; }
    const header = this.record();
    if (!header) return;

    const v = this.detailForm.value;

    // El desplegable ya solo ofrece la categoría de la guía, pero el backend no
    // valida esta regla: si el valor llega por otra vía, se para aquí antes de
    // grabar una guía con productos mezclados.
    const category = this.lockedCategory();
    const chosen = this.products().find((p) => p.id === +v.productId);
    if (category && chosen && chosen.categoryName !== category) {
      this.message.set({
        text: this.transloco.translate('guidesPage.categoryMismatch', { category }),
        type: 'error'
      });
      return;
    }

    // El camión no puede llevar más de lo que aguanta.
    if (this.wouldExceedCapacity()) {
      this.message.set({
        text: this.transloco.translate('guidesPage.capacityExceeded', {
          load: Math.round(this.loadedKg() + this.pendingLineKg()),
          capacity: this.capacityKg()
        }),
        type: 'error'
      });
      return;
    }
    const req: CreateGuideDetailRequest = {
      guideId: header.id,
      destinationStallId: +v.destinationStallId,
      productId: +v.productId,
      brandId: v.brandId ? +v.brandId : undefined,
      productSizeId: v.productSizeId ? +v.productSizeId : undefined,
      logisticUnitId: +v.logisticUnitId,
      quantity: +v.quantity,
      unitPrice: +(v.unitPrice || 0),
      transportUnitPrice: +v.transportUnitPrice,
      observations: v.observations || undefined
    };

    this.addingDetail.set(true);
    this.detailSvc.create(req).subscribe({
      next: (res) => {
        this.addingDetail.set(false);
        if (!res.success) { this.message.set({ text: res.message, type: 'error' }); return; }
        this.showAddDetailForm.set(false);
        this.resetDetailForm();
        this.refresh();
      },
      error: (err) => { this.addingDetail.set(false); this.showError(err); }
    });
  }

  /**
   * Una guía sin líneas no transporta nada, y una sobrecargada no puede salir:
   * ninguna de las dos se puede dar por terminada.
   */
  canFinish(): boolean {
    return this.details().length > 0 && !this.isOverloaded();
  }

  /** Cierra el alta: la guía ya está creada, solo se vuelve al listado. */
  finish(): void {
    if (!this.canFinish()) return;

    this.flash.set(this.transloco.translate('guidesPage.createdOk', {
      number: this.record()?.guideNumber ?? ''
    }));
    this.router.navigate([this.listPath]);
  }
}
