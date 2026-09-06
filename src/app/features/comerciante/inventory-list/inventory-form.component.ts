import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { InventoryService } from '../../../core/services/merchant.service';
import { InventoryResponse } from '../../../core/models/merchant.model';
import { CrudFormPageBase } from '../../../shared/base/crud-form-page.base';
import { FormPageComponent } from '../../../shared/components/form-page/form-page.component';
import { unwrapApi, unwrapApiOrNull } from '../../../shared/utils/api-response.operators';

/**
 * Alta y edición de inventario (`/nuevo`, `/:id/editar`).
 *
 * Editar solo cambia el stock mínimo — es lo único que acepta el backend
 * (`UpdateInventoryRequest`); stock actual y costo promedio los mueve el kardex.
 * En modo edición el resto de campos se muestran, pero deshabilitados.
 */
@Component({
  selector: 'app-inventory-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoModule, FormPageComponent],
  templateUrl: './inventory-form.component.html',
  styleUrl: './inventory-form.component.scss'
})
export class InventoryFormComponent extends CrudFormPageBase<InventoryResponse> implements OnInit {
  private readonly svc = inject(InventoryService);
  private readonly fb = inject(FormBuilder);

  protected readonly listPath = '/inventory';

  ngOnInit(): void {
    this.initPage();
  }

  protected override buildForm(): FormGroup {
    return this.fb.group({
      stallId: [null, Validators.required],
      productId: [null, Validators.required],
      logisticUnitId: [null, Validators.required],
      currentStock: [0, Validators.required],
      minimumStock: [0, Validators.required],
      averageCost: [0, Validators.required]
    });
  }

  protected override fetchById(id: number): Observable<InventoryResponse | null> {
    return unwrapApiOrNull(this.svc.getById(id));
  }

  protected override toFormValue(row: InventoryResponse) {
    return {
      stallId: row.stallId, productId: row.productId, logisticUnitId: row.logisticUnitId,
      currentStock: row.currentStock, minimumStock: row.minimumStock, averageCost: row.averageCost
    };
  }

  /** Al editar, todo salvo el mínimo queda de solo lectura. */
  protected override afterInit(): void {
    if (!this.isEdit() || !this.form) return;
    for (const key of ['stallId', 'productId', 'logisticUnitId', 'currentStock', 'averageCost']) {
      this.form.get(key)?.disable();
    }
  }

  protected override persist(v: any, current: InventoryResponse | null): Observable<unknown> {
    return current
      ? unwrapApi(this.svc.update({ id: current.id, minimumStock: +v.minimumStock }))
      : unwrapApi(this.svc.create({
          stallId: +v.stallId, productId: +v.productId, logisticUnitId: +v.logisticUnitId,
          currentStock: +v.currentStock, minimumStock: +v.minimumStock,
          averageCost: +v.averageCost, userId: 1
        }));
  }

  pageTitle(): string {
    return this.transloco.translate(this.isEdit() ? 'inventory.editMinStockTitle' : 'inventory.createTitle');
  }
}
