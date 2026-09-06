import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { ProductSizeService, ProductService } from '../../../core/services/master.service';
import { ProductSizeResponse, ProductResponse } from '../../../core/models/master.model';
import { CrudFormPageBase } from '../../../shared/base/crud-form-page.base';
import { FormPageComponent } from '../../../shared/components/form-page/form-page.component';
import { unwrapApi, unwrapApiOrNull } from '../../../shared/utils/api-response.operators';

/** Alta y edicion de presentaciones de producto (`/nuevo`, `/:id/editar`). */
@Component({
  selector: 'app-product-size-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoModule, FormPageComponent],
  templateUrl: './product-size-form.component.html',
  styleUrl: './product-size-form.component.scss'
})
export class ProductSizeFormComponent extends CrudFormPageBase<ProductSizeResponse> implements OnInit {
  private readonly svc = inject(ProductSizeService);
  private readonly prodSvc = inject(ProductService);
  private readonly fb = inject(FormBuilder);

  protected readonly listPath = '/product-sizes';

  readonly products = signal<ProductResponse[]>([]);

  ngOnInit(): void {
    this.initPage();
  }

  protected override buildForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      productId: [null, Validators.required]
    });
  }

  protected override loadLookups(): void {
    this.prodSvc.list(true).subscribe(res => { if (res.success) this.products.set(res.data); });
  }

  protected override fetchById(id: number): Observable<ProductSizeResponse | null> {
    return unwrapApiOrNull(this.svc.getById(id));
  }

  protected override toFormValue(row: ProductSizeResponse) {
    return { name: row.name, productId: row.productId };
  }

  protected override persist(v: any, current: ProductSizeResponse | null): Observable<unknown> {
    return current
      ? unwrapApi(this.svc.update({ id: current.id, name: v.name, productId: +v.productId, status: current.status }))
      : unwrapApi(this.svc.create({ name: v.name, productId: +v.productId }));
  }

  pageTitle(): string {
    return this.transloco.translate(this.isEdit() ? 'productSizes.editTitle' : 'productSizes.createTitle');
  }
}
