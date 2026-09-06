import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, map, throwError } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { GuideService } from '../../../core/services/guide.service';
import { CarrierService, TruckService } from '../../../core/services/transport.service';
import { SupplierService } from '../../../core/services/master.service';
import { AuthService } from '../../../core/services/auth.service';
import { GuideResponse } from '../../../core/models/guide.model';
import { CarrierResponse, TruckResponse } from '../../../core/models/transport.model';
import { SupplierResponse } from '../../../core/models/master.model';
import { CrudFormPageBase } from '../../../shared/base/crud-form-page.base';
import { FormPageComponent } from '../../../shared/components/form-page/form-page.component';
import { apiError } from '../../../shared/utils/api-response.operators';

/**
 * Primer paso del alta de una guía (`/nuevo`): la cabecera.
 *
 * El wizard de dos pasos dentro del modal pasa a ser dos rutas: al guardar la
 * cabecera salta a `/:id/editar`, donde se cargan las líneas. La ventaja de
 * separarlo es que una guía a medio llenar se puede retomar por su URL, cosa que
 * el modal no permitía — al cerrarlo se perdía el hilo.
 */
@Component({
  selector: 'app-guide-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoModule, FormPageComponent],
  templateUrl: './guide-form.component.html',
  styleUrl: './guide-form.component.scss'
})
export class GuideFormComponent extends CrudFormPageBase<GuideResponse> implements OnInit {
  private readonly svc = inject(GuideService);
  private readonly carrierSvc = inject(CarrierService);
  private readonly truckSvc = inject(TruckService);
  private readonly supplierSvc = inject(SupplierService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  protected readonly listPath = '/guides';

  readonly suppliers = signal<SupplierResponse[]>([]);
  readonly carriers = signal<CarrierResponse[]>([]);
  readonly trucks = signal<TruckResponse[]>([]);

  private createdId: number | null = null;

  ngOnInit(): void {
    this.initPage();
  }

  protected override buildForm(): FormGroup {
    return this.fb.group({
      supplierId: [null, Validators.required],
      carrierId: [null],
      truckId: [null],
      shipmentDate: ['', Validators.required],
      estimatedArrivalDate: [''],
      observations: ['']
    });
  }

  protected override loadLookups(): void {
    this.supplierSvc.list(true).subscribe((res) => { if (res.success) this.suppliers.set(res.data); });
    this.carrierSvc.list(true).subscribe((res) => { if (res.success) this.carriers.set(res.data); });
  }

  /** Los camiones dependen del transportista. */
  onCarrierChange(event: Event): void {
    const carrierId = +(event.target as HTMLSelectElement).value || null;
    this.form?.patchValue({ carrierId, truckId: null });
    this.trucks.set([]);
    if (!carrierId) return;
    this.truckSvc.listByCarrier(carrierId).subscribe((res) => {
      if (res.success) this.trucks.set(res.data);
    });
  }

  protected override persist(v: any): Observable<unknown> {
    // Esta pantalla solo da de alta la cabecera; nunca actualiza. Si llega aquí
    // con un id en la ruta es que está mal enrutada, y seguir adelante crearía
    // una guía nueva en cada intento en vez de editar la que ya existe. Falla
    // a la vista antes que duplicar en silencio.
    if (this.recordId() !== null) {
      return throwError(() => apiError(this.transloco.translate('guidesPage.wrongStepError')));
    }

    return this.svc.create({
      supplierId: +v.supplierId,
      carrierId: v.carrierId ? +v.carrierId : undefined,
      truckId: v.truckId ? +v.truckId : undefined,
      shipmentDate: v.shipmentDate,
      estimatedArrivalDate: v.estimatedArrivalDate || undefined,
      observations: v.observations || undefined,
      createdBy: this.auth.user()?.userId ?? 0
    }).pipe(
      map((res) => {
        if (!res.success || !res.data) throw apiError(res.message);
        this.createdId = res.data.id;
        return res.data;
      })
    );
  }

  /** Una guía sin líneas no sirve: continúa en el paso 2. */
  override goToList(): void {
    if (this.createdId) {
      this.router.navigate([this.listPath, this.createdId, 'editar']);
      return;
    }
    this.router.navigate([this.listPath]);
  }
}
