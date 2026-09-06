import { Component, OnInit, computed, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { StallService } from '../../../core/services/master.service';
import { StallResponse } from '../../../core/models/master.model';
import { CrudFormPageBase } from '../../../shared/base/crud-form-page.base';
import { FormPageComponent } from '../../../shared/components/form-page/form-page.component';
import { DetailViewComponent } from '../../../shared/components/detail-view/detail-view.component';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { DetailItem } from '../../../shared/models/detail-item.model';
import { unwrapApiOrNull } from '../../../shared/utils/api-response.operators';

/** Ficha de solo lectura (puesto, `/:id`). */
@Component({
  selector: 'app-stall-detail',
  standalone: true,
  imports: [TranslocoModule, FormPageComponent, DetailViewComponent, HasPermissionDirective],
  templateUrl: './stall-detail.component.html',
  styleUrl: './stall-detail.component.scss'
})
export class StallDetailComponent extends CrudFormPageBase<StallResponse> implements OnInit {
  private readonly svc = inject(StallService);
  protected readonly listPath = '/stalls';

  readonly items = computed<DetailItem[]>(() => {
    const row = this.record();
    if (!row) return [];
    return [
      { label: 'common.id', value: row.id, type: 'mono' },
      { label: 'stalls.number', value: row.number, type: 'mono' },
      { label: 'stalls.pavilion', value: row.pavilionName },
      { label: 'stalls.owner', value: row.ownerName },
      { label: 'common.status', value: row.status, type: 'status' },
      { label: 'common.createdAt', value: row.createdAt, type: 'date' }
    ];
  });

  ngOnInit(): void {
    this.initPage();
  }

  protected override fetchById(id: number): Observable<StallResponse | null> {
    return unwrapApiOrNull(this.svc.getById(id));
  }
}
