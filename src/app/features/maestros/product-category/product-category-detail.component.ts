import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { ProductCategoryService, ProductService } from '../../../core/services/master.service';
import { ProductCategoryResponse, ProductResponse } from '../../../core/models/master.model';
import { CrudFormPageBase } from '../../../shared/base/crud-form-page.base';
import { FormPageComponent } from '../../../shared/components/form-page/form-page.component';
import { DetailViewComponent } from '../../../shared/components/detail-view/detail-view.component';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { DetailItem } from '../../../shared/models/detail-item.model';

/** Ficha de solo lectura de una categoría (`/:id`), con sus productos. */
@Component({
  selector: 'app-product-category-detail',
  standalone: true,
  imports: [TranslocoModule, FormPageComponent, DetailViewComponent, HasPermissionDirective],
  templateUrl: './product-category-detail.component.html',
  styleUrl: './product-category-detail.component.scss'
})
export class ProductCategoryDetailComponent
  extends CrudFormPageBase<ProductCategoryResponse>
  implements OnInit {

  protected readonly service = inject(ProductCategoryService);
  private readonly productService = inject(ProductService);
  protected readonly listPath = '/product-categories';

  readonly products = signal<ProductResponse[]>([]);
  readonly loadingProducts = signal(false);

  readonly items = computed<DetailItem[]>(() => {
    const row = this.record();
    if (!row) return [];
    return [
      { label: 'common.id', value: row.id, type: 'mono' },
      { label: 'common.name', value: row.name },
      { label: 'common.status', value: row.status, type: 'status' },
      { label: 'common.createdAt', value: row.createdAt, type: 'date' },
      { label: 'common.description', value: row.description, span: true }
    ];
  });

  ngOnInit(): void {
    this.initPage();
  }

  protected override fetchById(id: number): Observable<ProductCategoryResponse | null> {
    return this.service.getById(id);
  }

  /** Los productos de la categoría son lo primero que se quiere ver al abrir la ficha. */
  protected override afterRecordLoaded(row: ProductCategoryResponse): void {
    this.loadingProducts.set(true);
    this.productService.list(undefined, row.id).subscribe({
      next: (res) => { this.products.set(res.data ?? []); this.loadingProducts.set(false); },
      error: () => { this.products.set([]); this.loadingProducts.set(false); }
    });
  }
}
