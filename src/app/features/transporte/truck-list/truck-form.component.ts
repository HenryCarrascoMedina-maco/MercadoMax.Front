import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { CarrierService, TruckService } from '../../../core/services/transport.service';
import { CarrierResponse, TruckResponse } from '../../../core/models/transport.model';
import { CrudFormPageBase } from '../../../shared/base/crud-form-page.base';
import { FormPageComponent } from '../../../shared/components/form-page/form-page.component';
import { unwrapApi, unwrapApiOrNull } from '../../../shared/utils/api-response.operators';

/** Alta y edicion: camiones (`/nuevo`, `/:id/editar`). */
@Component({
  selector: 'app-truck-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoModule, FormPageComponent],
  templateUrl: './truck-form.component.html',
  styleUrl: './truck-form.component.scss'
})
export class TruckFormComponent extends CrudFormPageBase<TruckResponse> implements OnInit {
  private readonly svc = inject(TruckService);
  private readonly carrierSvc = inject(CarrierService);
  private readonly fb = inject(FormBuilder);

  protected readonly listPath = '/trucks';

  /**
   * Se piden todos, no solo los activos: hace falta tener a mano el transportista
   * ya asignado aunque hoy esté dado de baja. Ver `carrierOptions`.
   */
  readonly carriers = signal<CarrierResponse[]>([]);

  /**
   * Lo que se ofrece en el desplegable: los activos, más el que el camión ya
   * tiene asignado aunque esté de baja.
   *
   * Sin ese añadido, editar la marca de un camión cuyo transportista fue dado de
   * baja dejaría el desplegable vacío y lo borraría al guardar, sin que nadie lo
   * haya pedido. Es el mismo criterio que `pickUserOptions` aplica a los usuarios.
   */
  readonly carrierOptions = computed<CarrierResponse[]>(() => {
    const all = this.carriers();
    const options = all.filter((c) => c.status);

    const assigned = this.record()?.carrierId;
    if (assigned && !options.some((c) => c.id === assigned)) {
      const row = all.find((c) => c.id === assigned);
      if (row) options.unshift(row);
    }

    return options;
  });

  ngOnInit(): void {
    this.initPage();
  }

  protected override buildForm(): FormGroup {
    return this.fb.group({
      licensePlate: ['', Validators.required],
      carrierId: [null, Validators.required],
      capacityKg: [null, [Validators.required, Validators.min(0.01)]],
      brand: [''],
      model: ['']
    });
  }

  protected override loadLookups(): void {
    this.carrierSvc.list().subscribe((res) => {
      if (!res.success) return;
      this.carriers.set(
        [...res.data].sort((a, b) =>
          `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
        )
      );
    });
  }

  /** Nombre y licencia: dos transportistas pueden llamarse igual. */
  carrierLabel(c: CarrierResponse): string {
    const name = `${c.firstName} ${c.lastName}`.trim();
    return c.licenseNumber ? `${name} · ${c.licenseNumber}` : name;
  }

  protected override fetchById(id: number): Observable<TruckResponse | null> {
    return unwrapApiOrNull(this.svc.getById(id));
  }

  protected override toFormValue(row: TruckResponse) {
    return { licensePlate: row.licensePlate, carrierId: row.carrierId, capacityKg: row.capacityKg, brand: row.brand, model: row.model };
  }

  protected override persist(v: any, current: TruckResponse | null): Observable<unknown> {
    // Los `<select>` e `<input type="number">` devuelven texto: los ids y la
    // capacidad viajan como número, que es lo que espera el DTO desde el
    // script 25 (antes la capacidad era texto libre y no se podía comparar).
    const payload = {
      ...v,
      carrierId: +v.carrierId,
      capacityKg: v.capacityKg === null || v.capacityKg === '' ? null : +v.capacityKg
    };

    return current
      ? unwrapApi(this.svc.update({ id: current.id, ...payload, status: current.status }))
      : unwrapApi(this.svc.create({ ...payload }));
  }

  pageTitle(): string {
    return this.transloco.translate(this.isEdit() ? 'trucks.editTitle' : 'trucks.createTitle');
  }
}
