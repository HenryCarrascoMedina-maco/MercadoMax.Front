import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, map } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { SaleService } from '../../../core/services/finance.service';
import { StallService } from '../../../core/services/master.service';
import { AuthService } from '../../../core/services/auth.service';
import { SaleListResponse, CreateSaleRequest } from '../../../core/models/finance.model';
import { StallResponse } from '../../../core/models/master.model';
import { CrudFormPageBase } from '../../../shared/base/crud-form-page.base';
import { FormPageComponent } from '../../../shared/components/form-page/form-page.component';
import { apiError } from '../../../shared/utils/api-response.operators';

/**
 * Alta de una venta (`/nuevo`): solo la cabecera. Las líneas necesitan el id, así
 * que al guardar salta a `/:id/editar`, que es donde se registran — el mismo
 * encadenado que hacía el modal al abrir el detalle recién creado.
 */
@Component({
  selector: 'app-sale-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoModule, FormPageComponent],
  templateUrl: './sale-form.component.html',
  styleUrl: './sale-form.component.scss'
})
export class SaleFormComponent extends CrudFormPageBase<SaleListResponse> implements OnInit {
  private readonly saleSvc = inject(SaleService);
  private readonly stallSvc = inject(StallService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  protected readonly listPath = '/sales';

  readonly stalls = signal<StallResponse[]>([]);

  private createdId: number | null = null;

  ngOnInit(): void {
    this.initPage();
  }

  protected override buildForm(): FormGroup {
    return this.fb.group({
      stallId: [null, Validators.required],
      customerName: [''],
      paymentType: ['Cash', Validators.required]
    });
  }

  protected override loadLookups(): void {
    this.stallSvc.list(true).subscribe((res) => {
      if (res.success) this.stalls.set(res.data);
    });
  }

  protected override persist(v: any): Observable<unknown> {
    const req: CreateSaleRequest = {
      stallId: +v.stallId,
      customerName: v.customerName || undefined,
      paymentType: v.paymentType,
      userId: this.auth.user()?.userId ?? 0
    };
    return this.saleSvc.create(req).pipe(
      map((res) => {
        if (!res.success) throw apiError(res.message);
        this.createdId = res.data;
        return res.data;
      })
    );
  }

  /** Una venta sin líneas no sirve: continúa en la pantalla de gestión. */
  override goToList(): void {
    if (this.createdId) {
      this.router.navigate([this.listPath, this.createdId, 'editar']);
      return;
    }
    this.router.navigate([this.listPath]);
  }
}
