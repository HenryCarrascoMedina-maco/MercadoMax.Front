import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { InventoryMovementService, InventoryService } from '../../../core/services/merchant.service';
import { InventoryMovementResponse, InventoryResponse } from '../../../core/models/merchant.model';
import { AuthService } from '../../../core/services/auth.service';
import { CrudFormPageBase } from '../../../shared/base/crud-form-page.base';
import { FormPageComponent } from '../../../shared/components/form-page/form-page.component';
import { unwrapApi } from '../../../shared/utils/api-response.operators';

/**
 * Registro de un movimiento de kardex (`/nuevo`). No hay ficha ni edición: un
 * movimiento no se corrige, se compensa con otro.
 *
 * El listado filtra por inventario; ese contexto viaja en `?inventoryId=` para
 * que el formulario abra con el mismo inventario ya elegido.
 */
@Component({
  selector: 'app-inventory-movement-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoModule, FormPageComponent],
  templateUrl: './inventory-movement-form.component.html',
  styleUrl: './inventory-movement-form.component.scss'
})
export class InventoryMovementFormComponent
  extends CrudFormPageBase<InventoryMovementResponse>
  implements OnInit {

  private readonly svc = inject(InventoryMovementService);
  private readonly inventorySvc = inject(InventoryService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  protected readonly listPath = '/inventory-movements';

  readonly inventoryList = signal<InventoryResponse[]>([]);
  readonly movementTypes = ['Inbound', 'Outbound', 'Adjustment'];

  ngOnInit(): void {
    this.initPage();
  }

  protected override buildForm(): FormGroup {
    return this.fb.group({
      inventoryId: [null, Validators.required],
      movementType: ['Inbound', Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.01)]],
      referenceType: [''],
      referenceId: [null],
      observations: ['']
    });
  }

  protected override loadLookups(): void {
    this.inventorySvc.list().subscribe((res) => {
      if (res.success) this.inventoryList.set(res.data);
    });
  }

  protected override afterInit(): void {
    const preset = this.route.snapshot.queryParamMap.get('inventoryId');
    if (preset) this.form?.patchValue({ inventoryId: +preset });
  }

  protected override persist(v: any): Observable<unknown> {
    return unwrapApi(this.svc.create({
      inventoryId: +v.inventoryId,
      movementType: v.movementType,
      quantity: +v.quantity,
      referenceType: v.referenceType || undefined,
      referenceId: v.referenceId ? +v.referenceId : undefined,
      observations: v.observations || undefined,
      userId: this.auth.user()?.userId ?? 0
    }));
  }

  /** Vuelve al listado conservando el inventario que se estaba mirando. */
  override goToList(): void {
    const inventoryId = this.form?.get('inventoryId')?.value
      ?? this.route.snapshot.queryParamMap.get('inventoryId');
    this.router.navigate([this.listPath], {
      queryParams: inventoryId ? { inventoryId } : {}
    });
  }
}
