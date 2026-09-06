import { Component, OnInit, computed, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { TruckService } from '../../../core/services/transport.service';
import { TruckResponse } from '../../../core/models/transport.model';
import { CrudFormPageBase } from '../../../shared/base/crud-form-page.base';
import { FormPageComponent } from '../../../shared/components/form-page/form-page.component';
import { DetailViewComponent } from '../../../shared/components/detail-view/detail-view.component';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { DetailItem } from '../../../shared/models/detail-item.model';
import { unwrapApiOrNull } from '../../../shared/utils/api-response.operators';

/** Ficha de solo lectura: camion (`/:id`). */
@Component({
  selector: 'app-truck-detail',
  standalone: true,
  imports: [TranslocoModule, FormPageComponent, DetailViewComponent, HasPermissionDirective],
  templateUrl: './truck-detail.component.html',
  styleUrl: './truck-detail.component.scss'
})
export class TruckDetailComponent extends CrudFormPageBase<TruckResponse> implements OnInit {
  private readonly svc = inject(TruckService);
  protected readonly listPath = '/trucks';

  readonly items = computed<DetailItem[]>(() => {
    const row = this.record();
    if (!row) return [];
    return [
      { label: 'common.id', value: row.id, type: 'mono' },
      { label: 'trucks.licensePlate', value: row.licensePlate, type: 'mono' },
      { label: 'trucks.carrier', value: row.carrierName },
      { label: 'trucks.capacityKg', value: row.capacityKg, type: 'mono' },
      { label: 'trucks.brand', value: row.brand },
      { label: 'trucks.model', value: row.model },
      { label: 'common.status', value: row.status, type: 'status' },
      { label: 'common.createdAt', value: row.createdAt, type: 'date' }
    ];
  });

  ngOnInit(): void {
    this.initPage();
  }

  protected override fetchById(id: number): Observable<TruckResponse | null> {
    return unwrapApiOrNull(this.svc.getById(id));
  }
}
