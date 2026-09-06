import { Component, OnInit, computed, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { ProductSizeService } from '../../../core/services/master.service';
import { ProductSizeResponse } from '../../../core/models/master.model';
import { CrudFormPageBase } from '../../../shared/base/crud-form-page.base';
import { FormPageComponent } from '../../../shared/components/form-page/form-page.component';
import { DetailViewComponent } from '../../../shared/components/detail-view/detail-view.component';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { DetailItem } from '../../../shared/models/detail-item.model';
import { unwrapApiOrNull } from '../../../shared/utils/api-response.operators';

/** Ficha de solo lectura (presentacion de producto, `/:id`). */
@Component({
  selector: 'app-product-size-detail',
  standalone: true,
  imports: [TranslocoModule, FormPageComponent, DetailViewComponent, HasPermissionDirective],
  templateUrl: './product-size-detail.component.html',
  styleUrl: './product-size-detail.component.scss'
})
export class ProductSizeDetailComponent extends CrudFormPageBase<ProductSizeResponse> implements OnInit {
  private readonly svc = inject(ProductSizeService);
  protected readonly listPath = '/product-sizes';

  readonly items = computed<DetailItem[]>(() => {
    const row = this.record();
    if (!row) return [];
    return [
      { label: 'common.id', value: row.id, type: 'mono' },
      { label: 'common.name', value: row.name },
      { label: 'productSizes.product', value: row.productName },
      { label: 'common.status', value: row.status, type: 'status' },
      { label: 'common.createdAt', value: row.createdAt, type: 'date' }
    ];
  });

  ngOnInit(): void {
    this.initPage();
  }

  protected override fetchById(id: number): Observable<ProductSizeResponse | null> {
    return unwrapApiOrNull(this.svc.getById(id));
  }
}
