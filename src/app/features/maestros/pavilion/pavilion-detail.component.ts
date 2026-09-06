import { Component, OnInit, computed, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { PavilionService } from '../../../core/services/master.service';
import { PavilionResponse } from '../../../core/models/master.model';
import { CrudFormPageBase } from '../../../shared/base/crud-form-page.base';
import { FormPageComponent } from '../../../shared/components/form-page/form-page.component';
import { DetailViewComponent } from '../../../shared/components/detail-view/detail-view.component';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { DetailItem } from '../../../shared/models/detail-item.model';
import { unwrapApiOrNull } from '../../../shared/utils/api-response.operators';

/** Ficha de solo lectura (pabellon, `/:id`). */
@Component({
  selector: 'app-pavilion-detail',
  standalone: true,
  imports: [TranslocoModule, FormPageComponent, DetailViewComponent, HasPermissionDirective],
  templateUrl: './pavilion-detail.component.html',
  styleUrl: './pavilion-detail.component.scss'
})
export class PavilionDetailComponent extends CrudFormPageBase<PavilionResponse> implements OnInit {
  private readonly svc = inject(PavilionService);
  protected readonly listPath = '/pavilions';

  readonly items = computed<DetailItem[]>(() => {
    const row = this.record();
    if (!row) return [];
    return [
      { label: 'common.id', value: row.id, type: 'mono' },
      { label: 'common.name', value: row.name },
      { label: 'pavilions.category', value: row.category },
      { label: 'pavilions.location', value: row.location },
      { label: 'common.status', value: row.status, type: 'status' },
      { label: 'common.createdAt', value: row.createdAt, type: 'date' }
    ];
  });

  ngOnInit(): void {
    this.initPage();
  }

  protected override fetchById(id: number): Observable<PavilionResponse | null> {
    return unwrapApiOrNull(this.svc.getById(id));
  }
}
