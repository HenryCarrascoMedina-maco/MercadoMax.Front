import { Component, OnInit, computed, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { BrandService } from '../../../core/services/master.service';
import { BrandResponse } from '../../../core/models/master.model';
import { CrudFormPageBase } from '../../../shared/base/crud-form-page.base';
import { FormPageComponent } from '../../../shared/components/form-page/form-page.component';
import { DetailViewComponent } from '../../../shared/components/detail-view/detail-view.component';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { DetailItem } from '../../../shared/models/detail-item.model';
import { unwrapApiOrNull } from '../../../shared/utils/api-response.operators';

/** Ficha de solo lectura (marca, `/:id`). */
@Component({
  selector: 'app-brand-detail',
  standalone: true,
  imports: [TranslocoModule, FormPageComponent, DetailViewComponent, HasPermissionDirective],
  templateUrl: './brand-detail.component.html',
  styleUrl: './brand-detail.component.scss'
})
export class BrandDetailComponent extends CrudFormPageBase<BrandResponse> implements OnInit {
  private readonly svc = inject(BrandService);
  protected readonly listPath = '/brands';

  readonly items = computed<DetailItem[]>(() => {
    const row = this.record();
    if (!row) return [];
    return [
      { label: 'common.id', value: row.id, type: 'mono' },
      { label: 'common.name', value: row.name },
      { label: 'brands.supplier', value: row.supplierName },
      { label: 'brands.product', value: row.productName },
      { label: 'common.status', value: row.status, type: 'status' },
      { label: 'common.createdAt', value: row.createdAt, type: 'date' }
    ];
  });

  ngOnInit(): void {
    this.initPage();
  }

  protected override fetchById(id: number): Observable<BrandResponse | null> {
    return unwrapApiOrNull(this.svc.getById(id));
  }
}
