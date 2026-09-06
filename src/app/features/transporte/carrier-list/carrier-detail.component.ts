import { Component, OnInit, computed, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { CarrierService } from '../../../core/services/transport.service';
import { CarrierResponse } from '../../../core/models/transport.model';
import { CrudFormPageBase } from '../../../shared/base/crud-form-page.base';
import { FormPageComponent } from '../../../shared/components/form-page/form-page.component';
import { DetailViewComponent } from '../../../shared/components/detail-view/detail-view.component';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { DetailItem } from '../../../shared/models/detail-item.model';
import { unwrapApiOrNull } from '../../../shared/utils/api-response.operators';

/** Ficha de solo lectura: transportista (`/:id`). */
@Component({
  selector: 'app-carrier-detail',
  standalone: true,
  imports: [TranslocoModule, FormPageComponent, DetailViewComponent, HasPermissionDirective],
  templateUrl: './carrier-detail.component.html',
  styleUrl: './carrier-detail.component.scss'
})
export class CarrierDetailComponent extends CrudFormPageBase<CarrierResponse> implements OnInit {
  private readonly svc = inject(CarrierService);
  protected readonly listPath = '/carriers';

  readonly items = computed<DetailItem[]>(() => {
    const row = this.record();
    if (!row) return [];
    return [
      { label: 'common.id', value: row.id, type: 'mono' },
      { label: 'common.name', value: row.firstName + ' ' + row.lastName },
      { label: 'carriers.document', value: row.documentId, type: 'mono' },
      { label: 'common.phone', value: row.phone },
      { label: 'carriers.licenseNumber', value: row.licenseNumber, type: 'mono' },
      { label: 'carriers.userId', value: row.userId, type: 'mono' },
      { label: 'common.status', value: row.status, type: 'status' },
      { label: 'common.createdAt', value: row.createdAt, type: 'date' }
    ];
  });

  ngOnInit(): void {
    this.initPage();
  }

  protected override fetchById(id: number): Observable<CarrierResponse | null> {
    return unwrapApiOrNull(this.svc.getById(id));
  }
}
