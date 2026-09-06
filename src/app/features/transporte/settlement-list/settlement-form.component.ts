import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, map } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { SettlementService, CarrierService, TruckService } from '../../../core/services/transport.service';
import {
  SettlementListResponse, CreateSettlementRequest,
  CarrierResponse, TruckResponse
} from '../../../core/models/transport.model';
import { CrudFormPageBase } from '../../../shared/base/crud-form-page.base';
import { FormPageComponent } from '../../../shared/components/form-page/form-page.component';
import { apiError } from '../../../shared/utils/api-response.operators';

/**
 * Alta de una liquidación (`/nuevo`). Solo la cabecera: las líneas se añaden
 * después, desde la ficha, porque necesitan el id de la liquidación.
 *
 * Tras crear, va directo a esa ficha en vez de al listado — es donde sigue el
 * trabajo.
 */
@Component({
  selector: 'app-settlement-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoModule, FormPageComponent],
  templateUrl: './settlement-form.component.html',
  styleUrl: './settlement-form.component.scss'
})
export class SettlementFormComponent extends CrudFormPageBase<SettlementListResponse> implements OnInit {
  private readonly settlementSvc = inject(SettlementService);
  private readonly carrierSvc = inject(CarrierService);
  private readonly truckSvc = inject(TruckService);
  private readonly fb = inject(FormBuilder);

  protected readonly listPath = '/settlements';

  readonly carriers = signal<CarrierResponse[]>([]);
  readonly trucks = signal<TruckResponse[]>([]);

  /** Id de la liquidación recién creada, para saltar a su ficha. */
  private createdId: number | null = null;

  ngOnInit(): void {
    this.initPage();
  }

  protected override buildForm(): FormGroup {
    return this.fb.group({
      carrierId: [null, Validators.required],
      truckId: [null],
      tripDate: ['', Validators.required]
    });
  }

  protected override loadLookups(): void {
    this.carrierSvc.list(true).subscribe((res) => {
      if (res.success) this.carriers.set(res.data);
    });
  }

  /** Los camiones dependen del transportista elegido. */
  onCarrierChange(carrierId: string): void {
    this.form?.patchValue({ truckId: null });
    if (!carrierId) { this.trucks.set([]); return; }
    this.truckSvc.listByCarrier(+carrierId).subscribe((res) => {
      if (res.success) this.trucks.set(res.data);
    });
  }

  protected override persist(v: any): Observable<unknown> {
    const req: CreateSettlementRequest = {
      carrierId: +v.carrierId,
      truckId: v.truckId ? +v.truckId : undefined,
      tripDate: v.tripDate
    };
    return this.settlementSvc.create(req).pipe(
      map((res) => {
        if (!res.success) throw apiError(res.message);
        this.createdId = res.data;
        return res.data;
      })
    );
  }

  /** Al guardar sigue en la ficha: la liquidación aún no tiene líneas. */
  override goToList(): void {
    if (this.createdId) {
      this.router.navigate([this.listPath, this.createdId]);
      return;
    }
    this.router.navigate([this.listPath]);
  }
}
