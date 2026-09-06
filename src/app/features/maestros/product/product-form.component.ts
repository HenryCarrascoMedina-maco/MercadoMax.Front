import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { ProductService, ProductCategoryService } from '../../../core/services/master.service';
import { ProductResponse, ProductCategoryResponse } from '../../../core/models/master.model';
import { CrudFormPageBase } from '../../../shared/base/crud-form-page.base';
import { FormPageComponent } from '../../../shared/components/form-page/form-page.component';
import { unwrapApi, unwrapApiOrNull } from '../../../shared/utils/api-response.operators';

/** Alta y edición de productos (`/nuevo`, `/:id/editar`). */
@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoModule, FormPageComponent],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.scss'
})
export class ProductFormComponent extends CrudFormPageBase<ProductResponse> implements OnInit {
  private readonly svc = inject(ProductService);
  private readonly catSvc = inject(ProductCategoryService);
  private readonly fb = inject(FormBuilder);

  protected readonly listPath = '/products';

  readonly categories = signal<ProductCategoryResponse[]>([]);

  ngOnInit(): void {
    this.initPage();
  }

  protected override buildForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      categoryId: [null, Validators.required],
      description: ['']
    });
  }

  protected override loadLookups(): void {
    this.catSvc.getAll({ status: true }).subscribe((data) => { if (data) this.categories.set(data); });
  }

  protected override fetchById(id: number): Observable<ProductResponse | null> {
    return unwrapApiOrNull(this.svc.getById(id));
  }

  protected override toFormValue(row: ProductResponse) {
    return { name: row.name, categoryId: row.categoryId, description: row.description };
  }

  protected override persist(v: any, current: ProductResponse | null): Observable<unknown> {
    return current
      ? unwrapApi(this.svc.update({
          id: current.id, name: v.name, categoryId: +v.categoryId,
          description: v.description, status: current.status
        }))
      : unwrapApi(this.svc.create({ name: v.name, categoryId: +v.categoryId, description: v.description }));
  }

  pageTitle(): string {
    return this.transloco.translate(this.isEdit() ? 'products.editTitle' : 'products.createTitle');
  }
}
