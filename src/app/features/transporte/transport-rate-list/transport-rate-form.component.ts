import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { TransportRateService, CarrierService } from '../../../core/services/transport.service';
import { LogisticUnitService } from '../../../core/services/master.service';
import { TransportRateResponse, CarrierResponse } from '../../../core/models/transport.model';
import { LogisticUnitResponse } from '../../../core/models/master.model';
import { CrudFormPageBase } from '../../../shared/base/crud-form-page.base';
import { FormPageComponent } from '../../../shared/components/form-page/form-page.component';
import { unwrapApi, unwrapApiOrNull } from '../../../shared/utils/api-response.operators';

/**
 * Alta y edición de tarifas de transporte (`/nuevo`, `/:id/editar`).
 *
 * Transportista y unidad se eligen de lista. Aquí no hay opciones "ya usadas":
 * un transportista tiene una tarifa por cada ruta y unidad, así que ambos campos
 * se repiten legítimamente entre tarifas.
 */
@Component({
  selector: 'app-transport-rate-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoModule, FormPageComponent],
  templateUrl: './transport-rate-form.component.html',
  styleUrl: './transport-rate-form.component.scss'
})
export class TransportRateFormComponent extends CrudFormPageBase<TransportRateResponse> implements OnInit {
  private readonly svc = inject(TransportRateService);
  private readonly carrierSvc = inject(CarrierService);
  private readonly luSvc = inject(LogisticUnitService);
  private readonly fb = inject(FormBuilder);

  protected readonly listPath = '/transport-rates';

  readonly carriers = signal<CarrierResponse[]>([]);
  readonly logisticUnits = signal<LogisticUnitResponse[]>([]);

  ngOnInit(): void {
    this.initPage();
  }

  protected override loadLookups(): void {
    this.carrierSvc.list(true).subscribe((res) => { if (res.success) this.carriers.set(res.data); });
    this.luSvc.list(true).subscribe((res) => { if (res.success) this.logisticUnits.set(res.data); });
  }

  protected override buildForm(): FormGroup {
    return this.fb.group({
      carrierId: [null, Validators.required],
      logisticUnitId: [null, Validators.required],
      routeOrigin: ['', Validators.required],
      routeDestination: ['', Validators.required],
      unitPrice: [null, Validators.required],
      effectiveDate: ['', Validators.required]
    });
  }

  protected override fetchById(id: number): Observable<TransportRateResponse | null> {
    return unwrapApiOrNull(this.svc.getById(id));
  }

  protected override toFormValue(row: TransportRateResponse) {
    return { carrierId: row.carrierId, logisticUnitId: row.logisticUnitId, routeOrigin: row.routeOrigin, routeDestination: row.routeDestination, unitPrice: row.unitPrice, effectiveDate: row.effectiveDate?.split('T')[0] };
  }

  protected override persist(v: any, current: TransportRateResponse | null): Observable<unknown> {
    // Los `<select>` devuelven texto: los ids y el precio van al backend como número.
    const payload = {
      carrierId: +v.carrierId,
      logisticUnitId: +v.logisticUnitId,
      routeOrigin: v.routeOrigin,
      routeDestination: v.routeDestination,
      unitPrice: +v.unitPrice,
      effectiveDate: v.effectiveDate
    };

    return current
      ? unwrapApi(this.svc.update({ id: current.id, ...payload, status: current.status }))
      : unwrapApi(this.svc.create(payload));
  }

  pageTitle(): string {
    return this.transloco.translate(this.isEdit() ? 'rates.editTitle' : 'rates.createTitle');
  }
}
