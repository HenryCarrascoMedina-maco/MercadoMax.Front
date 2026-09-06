import { Component, OnInit, computed, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { SupplierService } from '../../../core/services/master.service';
import { SupplierResponse } from '../../../core/models/master.model';
import { CrudFormPageBase } from '../../../shared/base/crud-form-page.base';
import { FormPageComponent } from '../../../shared/components/form-page/form-page.component';
import { DetailViewComponent } from '../../../shared/components/detail-view/detail-view.component';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { DetailItem } from '../../../shared/models/detail-item.model';
import { unwrapApiOrNull } from '../../../shared/utils/api-response.operators';

/** Ficha de solo lectura (proveedor, `/:id`). */
@Component({
  selector: 'app-supplier-detail',
  standalone: true,
  imports: [TranslocoModule, FormPageComponent, DetailViewComponent, HasPermissionDirective],
  templateUrl: './supplier-detail.component.html',
  styleUrl: './supplier-detail.component.scss'
})
export class SupplierDetailComponent extends CrudFormPageBase<SupplierResponse> implements OnInit {
  private readonly svc = inject(SupplierService);
  protected readonly listPath = '/suppliers';

  readonly items = computed<DetailItem[]>(() => {
    const row = this.record();
    if (!row) return [];
    return [
      { label: 'common.id', value: row.id, type: 'mono' },
      { label: 'suppliers.businessName', value: row.businessName },
      { label: 'suppliers.taxId', value: row.taxId, type: 'mono' },
      { label: 'common.phone', value: row.phone },
      { label: 'suppliers.contactName', value: row.contactName },
      { label: 'suppliers.contactPhone', value: row.contactPhone },
      { label: 'suppliers.province', value: row.province },
      { label: 'suppliers.department', value: row.department },
      { label: 'common.status', value: row.status, type: 'status' },
      { label: 'common.createdAt', value: row.createdAt, type: 'date' },
      { label: 'suppliers.address', value: row.address, span: true }
    ];
  });

  ngOnInit(): void {
    this.initPage();
  }

  protected override fetchById(id: number): Observable<SupplierResponse | null> {
    return unwrapApiOrNull(this.svc.getById(id));
  }
}
