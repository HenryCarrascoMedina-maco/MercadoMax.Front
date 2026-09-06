import { Component, OnInit, computed, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { InventoryService } from '../../../core/services/merchant.service';
import { InventoryResponse } from '../../../core/models/merchant.model';
import { CrudFormPageBase } from '../../../shared/base/crud-form-page.base';
import { FormPageComponent } from '../../../shared/components/form-page/form-page.component';
import { DetailViewComponent } from '../../../shared/components/detail-view/detail-view.component';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { DetailItem } from '../../../shared/models/detail-item.model';
import { unwrapApiOrNull } from '../../../shared/utils/api-response.operators';

/** Ficha de una línea de inventario (`/:id`). */
@Component({
  selector: 'app-inventory-detail',
  standalone: true,
  imports: [TranslocoModule, FormPageComponent, DetailViewComponent, HasPermissionDirective],
  templateUrl: './inventory-detail.component.html',
  styleUrl: './inventory-detail.component.scss'
})
export class InventoryDetailComponent extends CrudFormPageBase<InventoryResponse> implements OnInit {
  private readonly svc = inject(InventoryService);
  protected readonly listPath = '/inventory';

  readonly items = computed<DetailItem[]>(() => {
    const row = this.record();
    if (!row) return [];
    return [
      { label: 'common.id', value: row.id, type: 'mono' },
      { label: 'inventory.product', value: row.productName },
      { label: 'inventory.stall', value: row.stallCode },
      { label: 'inventory.logisticUnit', value: row.logisticUnitName },
      { label: 'inventory.currentStock', value: row.currentStock, type: 'mono' },
      { label: 'inventory.minimumStock', value: row.minimumStock, type: 'mono' },
      { label: 'inventory.averageCost', value: row.averageCost, type: 'money' },
      { label: 'common.status', value: row.status, type: 'status' },
      { label: 'inventory.lastUpdated', value: row.lastUpdated, type: 'date' }
    ];
  });

  ngOnInit(): void {
    this.initPage();
  }

  protected override fetchById(id: number): Observable<InventoryResponse | null> {
    return unwrapApiOrNull(this.svc.getById(id));
  }
}
