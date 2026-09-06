import { Component, OnInit, inject } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { ProductCategoryService } from '../../../core/services/master.service';
import {
  ProductCategoryResponse,
  CreateProductCategoryRequest,
  UpdateProductCategoryRequest
} from '../../../core/models/master.model';
import { CrudListBase } from '../../../shared/base/crud-list.base';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { TableColumn } from '../../../shared/models/table-column.model';
import { ActionConfig } from '../../../shared/models/action-config.model';

@Component({
  selector: 'app-product-category-list',
  standalone: true,
  imports: [
    TranslocoModule,
    DataTableComponent,
    ConfirmDialogComponent,
    HasPermissionDirective
  ],
  templateUrl: './product-category-list.component.html',
  styleUrl: './product-category-list.component.scss'
})
export class ProductCategoryListComponent
  extends CrudListBase<ProductCategoryResponse, CreateProductCategoryRequest, UpdateProductCategoryRequest>
  implements OnInit {

  protected readonly service = inject(ProductCategoryService);
  protected readonly listPath = '/product-categories';

  readonly columns: TableColumn<ProductCategoryResponse>[] = [
    { key: 'id', label: 'common.id' },
    { key: 'name', label: 'common.name' },
    { key: 'description', label: 'common.description' },
    { key: 'status', label: 'common.status', type: 'status' }
  ];

  readonly rowActions: ActionConfig<ProductCategoryResponse>[] = [
    { key: 'view', icon: '👁️', label: 'common.view' },
    { key: 'edit', icon: '✏️', label: 'common.edit', permission: 'Masters:Update' },
    { key: 'delete', icon: '🗑️', label: 'common.delete', permission: 'Masters:Delete' }
  ];

  ngOnInit(): void {
    this.consumeFlash();
    this.loadData();
  }
}
