import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { BrandService, SupplierService, ProductService } from '../../../core/services/master.service';
import { BrandResponse, SupplierResponse, ProductResponse } from '../../../core/models/master.model';
import { CrudFormPageBase } from '../../../shared/base/crud-form-page.base';
import { FormPageComponent } from '../../../shared/components/form-page/form-page.component';
import { unwrapApi, unwrapApiOrNull } from '../../../shared/utils/api-response.operators';

/** Alta y edicion de marcas (`/nuevo`, `/:id/editar`). */
@Component({
  selector: 'app-brand-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoModule, FormPageComponent],
  templateUrl: './brand-form.component.html',
  styleUrl: './brand-form.component.scss'
})
export class BrandFormComponent extends CrudFormPageBase<BrandResponse> implements OnInit {
  private readonly svc = inject(BrandService);
  private readonly supSvc = inject(SupplierService);
  private readonly prodSvc = inject(ProductService);
  private readonly fb = inject(FormBuilder);

  protected readonly listPath = '/brands';

  readonly suppliers = signal<SupplierResponse[]>([]);
  readonly products = signal<ProductResponse[]>([]);

  ngOnInit(): void {
    this.initPage();
  }

  protected override buildForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      supplierId: [null, Validators.required],
      productId: [null, Validators.required]
    });
  }

  protected override loadLookups(): void {
    this.supSvc.list(true).subscribe(res => { if (res.success) this.suppliers.set(res.data); });
    this.prodSvc.list(true).subscribe(res => { if (res.success) this.products.set(res.data); });
  }

  protected override fetchById(id: number): Observable<BrandResponse | null> {
    return unwrapApiOrNull(this.svc.getById(id));
  }

  protected override toFormValue(row: BrandResponse) {
    return { name: row.name, supplierId: row.supplierId, productId: row.productId };
  }

  protected override persist(v: any, current: BrandResponse | null): Observable<unknown> {
    return current
      ? unwrapApi(this.svc.update({ id: current.id, name: v.name, supplierId: +v.supplierId, productId: +v.productId, status: current.status }))
      : unwrapApi(this.svc.create({ name: v.name, supplierId: +v.supplierId, productId: +v.productId }));
  }

  pageTitle(): string {
    return this.transloco.translate(this.isEdit() ? 'brands.editTitle' : 'brands.createTitle');
  }
}
