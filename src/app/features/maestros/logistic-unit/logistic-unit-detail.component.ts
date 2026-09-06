import { Component, OnInit, computed, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { LogisticUnitService } from '../../../core/services/master.service';
import { LogisticUnitResponse } from '../../../core/models/master.model';
import { CrudFormPageBase } from '../../../shared/base/crud-form-page.base';
import { FormPageComponent } from '../../../shared/components/form-page/form-page.component';
import { DetailViewComponent } from '../../../shared/components/detail-view/detail-view.component';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { DetailItem } from '../../../shared/models/detail-item.model';
import { unwrapApiOrNull } from '../../../shared/utils/api-response.operators';

/** Ficha de solo lectura (unidad logistica, `/:id`). */
@Component({
  selector: 'app-logistic-unit-detail',
  standalone: true,
  imports: [TranslocoModule, FormPageComponent, DetailViewComponent, HasPermissionDirective],
  templateUrl: './logistic-unit-detail.component.html',
  styleUrl: './logistic-unit-detail.component.scss'
})
export class LogisticUnitDetailComponent extends CrudFormPageBase<LogisticUnitResponse> implements OnInit {
  private readonly svc = inject(LogisticUnitService);
  protected readonly listPath = '/logistic-units';

  readonly items = computed<DetailItem[]>(() => {
    const row = this.record();
    if (!row) return [];
    return [
      { label: 'common.id', value: row.id, type: 'mono' },
      { label: 'common.name', value: row.name },
      { label: 'logisticUnits.abbreviation', value: row.abbreviation, type: 'mono' },
      { label: 'logisticUnits.weightKg', value: row.weightKg, type: 'mono' },
      { label: 'common.status', value: row.status, type: 'status' },
      { label: 'common.createdAt', value: row.createdAt, type: 'date' }
    ];
  });

  ngOnInit(): void {
    this.initPage();
  }

  protected override fetchById(id: number): Observable<LogisticUnitResponse | null> {
    return unwrapApiOrNull(this.svc.getById(id));
  }
}
