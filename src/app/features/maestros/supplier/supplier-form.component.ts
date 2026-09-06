import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { SupplierService } from '../../../core/services/master.service';
import { SupplierResponse } from '../../../core/models/master.model';
import { CrudFormPageBase } from '../../../shared/base/crud-form-page.base';
import { FormPageComponent } from '../../../shared/components/form-page/form-page.component';
import { unwrapApi, unwrapApiOrNull } from '../../../shared/utils/api-response.operators';

/** Alta y edicion de proveedores (`/nuevo`, `/:id/editar`). */
@Component({
  selector: 'app-supplier-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoModule, FormPageComponent],
  templateUrl: './supplier-form.component.html',
  styleUrl: './supplier-form.component.scss'
})
export class SupplierFormComponent extends CrudFormPageBase<SupplierResponse> implements OnInit {
  private readonly svc = inject(SupplierService);
  private readonly fb = inject(FormBuilder);

  protected readonly listPath = '/suppliers';

  ngOnInit(): void {
    this.initPage();
  }

  protected override buildForm(): FormGroup {
    return this.fb.group({
      businessName: ['', Validators.required],
      taxId: ['', Validators.required],
      phone: [''],
      address: [''],
      province: [''],
      department: [''],
      contactName: [''],
      contactPhone: ['']
    });
  }

  protected override fetchById(id: number): Observable<SupplierResponse | null> {
    return unwrapApiOrNull(this.svc.getById(id));
  }

  protected override toFormValue(row: SupplierResponse) {
    return { businessName: row.businessName, taxId: row.taxId, phone: row.phone, address: row.address, province: row.province, department: row.department, contactName: row.contactName, contactPhone: row.contactPhone };
  }

  protected override persist(v: any, current: SupplierResponse | null): Observable<unknown> {
    return current
      ? unwrapApi(this.svc.update({ id: current.id, businessName: v.businessName, taxId: v.taxId, phone: v.phone, address: v.address, province: v.province, department: v.department, contactName: v.contactName, contactPhone: v.contactPhone, status: current.status }))
      : unwrapApi(this.svc.create({ businessName: v.businessName, taxId: v.taxId, phone: v.phone, address: v.address, province: v.province, department: v.department, contactName: v.contactName, contactPhone: v.contactPhone }));
  }

  pageTitle(): string {
    return this.transloco.translate(this.isEdit() ? 'suppliers.editTitle' : 'suppliers.createTitle');
  }
}
