import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { LogisticUnitService } from '../../../core/services/master.service';
import { LogisticUnitResponse } from '../../../core/models/master.model';
import { CrudFormPageBase } from '../../../shared/base/crud-form-page.base';
import { FormPageComponent } from '../../../shared/components/form-page/form-page.component';
import { unwrapApi, unwrapApiOrNull } from '../../../shared/utils/api-response.operators';

/** Alta y edicion de unidades logisticas (`/nuevo`, `/:id/editar`). */
@Component({
  selector: 'app-logistic-unit-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoModule, FormPageComponent],
  templateUrl: './logistic-unit-form.component.html',
  styleUrl: './logistic-unit-form.component.scss'
})
export class LogisticUnitFormComponent extends CrudFormPageBase<LogisticUnitResponse> implements OnInit {
  private readonly svc = inject(LogisticUnitService);
  private readonly fb = inject(FormBuilder);

  protected readonly listPath = '/logistic-units';

  ngOnInit(): void {
    this.initPage();
  }

  protected override buildForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      abbreviation: ['', Validators.required],
      // Opcional: una unidad sin peso no suma a la carga de la guía y se avisa.
      weightKg: [null, Validators.min(0.001)]
    });
  }

  protected override fetchById(id: number): Observable<LogisticUnitResponse | null> {
    return unwrapApiOrNull(this.svc.getById(id));
  }

  protected override toFormValue(row: LogisticUnitResponse) {
    return { name: row.name, abbreviation: row.abbreviation, weightKg: row.weightKg };
  }

  protected override persist(v: any, current: LogisticUnitResponse | null): Observable<unknown> {
    return current
      ? unwrapApi(this.svc.update({ id: current.id, name: v.name, abbreviation: v.abbreviation, weightKg: v.weightKg ? +v.weightKg : null, status: current.status }))
      : unwrapApi(this.svc.create({ name: v.name, abbreviation: v.abbreviation, weightKg: v.weightKg ? +v.weightKg : null }));
  }

  pageTitle(): string {
    return this.transloco.translate(this.isEdit() ? 'logisticUnits.editTitle' : 'logisticUnits.createTitle');
  }
}
