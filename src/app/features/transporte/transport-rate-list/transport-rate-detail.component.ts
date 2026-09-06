import { Component, OnInit, computed, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { TransportRateService } from '../../../core/services/transport.service';
import { TransportRateResponse } from '../../../core/models/transport.model';
import { CrudFormPageBase } from '../../../shared/base/crud-form-page.base';
import { FormPageComponent } from '../../../shared/components/form-page/form-page.component';
import { DetailViewComponent } from '../../../shared/components/detail-view/detail-view.component';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { DetailItem } from '../../../shared/models/detail-item.model';
import { unwrapApiOrNull } from '../../../shared/utils/api-response.operators';

/** Ficha de solo lectura: tarifa de transporte (`/:id`). */
@Component({
  selector: 'app-transport-rate-detail',
  standalone: true,
  imports: [TranslocoModule, FormPageComponent, DetailViewComponent, HasPermissionDirective],
  templateUrl: './transport-rate-detail.component.html',
  styleUrl: './transport-rate-detail.component.scss'
})
export class TransportRateDetailComponent extends CrudFormPageBase<TransportRateResponse> implements OnInit {
  private readonly svc = inject(TransportRateService);
  protected readonly listPath = '/transport-rates';

  readonly items = computed<DetailItem[]>(() => {
    const row = this.record();
    if (!row) return [];
    return [
      { label: 'common.id', value: row.id, type: 'mono' },
      { label: 'rates.carrier', value: row.carrierName },
      { label: 'rates.logisticUnit', value: row.logisticUnitName },
      { label: 'common.origin', value: row.routeOrigin },
      { label: 'common.destination', value: row.routeDestination },
      { label: 'rates.unitPrice', value: row.unitPrice, type: 'money' },
      { label: 'rates.effectiveDate', value: row.effectiveDate, type: 'date' },
      { label: 'common.status', value: row.status, type: 'status' },
      { label: 'common.createdAt', value: row.createdAt, type: 'date' }
    ];
  });

  ngOnInit(): void {
    this.initPage();
  }

  protected override fetchById(id: number): Observable<TransportRateResponse | null> {
    return unwrapApiOrNull(this.svc.getById(id));
  }
}
