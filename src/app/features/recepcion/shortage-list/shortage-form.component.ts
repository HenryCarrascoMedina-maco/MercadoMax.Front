import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { ShortageService } from '../../../core/services/reception.service';
import { ShortageResponse } from '../../../core/models/reception.model';
import { CrudFormPageBase } from '../../../shared/base/crud-form-page.base';
import { FormPageComponent } from '../../../shared/components/form-page/form-page.component';
import { unwrapApi } from '../../../shared/utils/api-response.operators';

/**
 * Alta de faltantes (`/nuevo`). No hay ficha ni edición: el backend solo expone
 * crear y cambiar el estado del reclamo, que se hace desde el listado.
 */
@Component({
  selector: 'app-shortage-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoModule, FormPageComponent],
  templateUrl: './shortage-form.component.html',
  styleUrl: './shortage-form.component.scss'
})
export class ShortageFormComponent extends CrudFormPageBase<ShortageResponse> implements OnInit {
  private readonly svc = inject(ShortageService);
  private readonly fb = inject(FormBuilder);

  protected readonly listPath = '/shortages';

  ngOnInit(): void {
    this.initPage();
  }

  protected override buildForm(): FormGroup {
    return this.fb.group({
      receptionDetailId: [null, Validators.required],
      shortageQuantity: [null, Validators.required],
      reason: ['', Validators.required],
      evidence: ['']
    });
  }

  protected override persist(v: any): Observable<unknown> {
    return unwrapApi(this.svc.create({ ...v, userId: 1 }));
  }
}
