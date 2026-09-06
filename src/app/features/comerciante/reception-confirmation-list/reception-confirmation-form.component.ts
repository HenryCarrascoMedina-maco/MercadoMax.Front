import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { ReceptionConfirmationService } from '../../../core/services/merchant.service';
import { StallService } from '../../../core/services/master.service';
import { ReceptionConfirmationResponse } from '../../../core/models/merchant.model';
import { StallResponse } from '../../../core/models/master.model';
import { AuthService } from '../../../core/services/auth.service';
import { CrudFormPageBase } from '../../../shared/base/crud-form-page.base';
import { FormPageComponent } from '../../../shared/components/form-page/form-page.component';
import { unwrapApi } from '../../../shared/utils/api-response.operators';

/**
 * Alta de una confirmación de recepción (`/nuevo`). El backend solo expone crear
 * y listar por puesto, así que no hay ficha ni edición.
 *
 * El puesto seleccionado en el listado viaja en `?stallId=`.
 */
@Component({
  selector: 'app-reception-confirmation-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoModule, FormPageComponent],
  templateUrl: './reception-confirmation-form.component.html',
  styleUrl: './reception-confirmation-form.component.scss'
})
export class ReceptionConfirmationFormComponent
  extends CrudFormPageBase<ReceptionConfirmationResponse>
  implements OnInit {

  private readonly svc = inject(ReceptionConfirmationService);
  private readonly stallSvc = inject(StallService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  protected readonly listPath = '/reception-confirmations';

  readonly stalls = signal<StallResponse[]>([]);

  ngOnInit(): void {
    this.initPage();
  }

  protected override buildForm(): FormGroup {
    return this.fb.group({
      receptionId: [null, [Validators.required, Validators.min(1)]],
      stallId: [null, Validators.required],
      confirmationDate: ['', Validators.required],
      observations: ['']
    });
  }

  protected override loadLookups(): void {
    this.stallSvc.list().subscribe((res) => {
      if (res.success) this.stalls.set(res.data);
    });
  }

  protected override afterInit(): void {
    const preset = this.route.snapshot.queryParamMap.get('stallId');
    this.form?.patchValue({
      confirmationDate: new Date().toISOString().split('T')[0],
      ...(preset ? { stallId: +preset } : {})
    });
  }

  protected override persist(v: any): Observable<unknown> {
    return unwrapApi(this.svc.create({
      receptionId: +v.receptionId,
      stallId: +v.stallId,
      confirmationDate: v.confirmationDate,
      observations: v.observations || undefined,
      userId: this.auth.user()?.userId ?? 0
    }));
  }

  /** Vuelve al listado con el puesto que se estaba mirando. */
  override goToList(): void {
    const stallId = this.form?.get('stallId')?.value
      ?? this.route.snapshot.queryParamMap.get('stallId');
    this.router.navigate([this.listPath], { queryParams: stallId ? { stallId } : {} });
  }
}
