import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { StallService, PavilionService } from '../../../core/services/master.service';
import { StallResponse, PavilionResponse } from '../../../core/models/master.model';
import { UserOption, UserPickerService, pickUserOptions } from '../../../core/services/user-picker.service';
import { CrudFormPageBase } from '../../../shared/base/crud-form-page.base';
import { FormPageComponent } from '../../../shared/components/form-page/form-page.component';
import { unwrapApi, unwrapApiOrNull } from '../../../shared/utils/api-response.operators';

/** Rol de quien puede ser dueño de un puesto. */
const OWNER_ROLE = 'Merchant';

/** Alta y edicion de puestos (`/nuevo`, `/:id/editar`). */
@Component({
  selector: 'app-stall-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoModule, FormPageComponent],
  templateUrl: './stall-form.component.html',
  styleUrl: './stall-form.component.scss'
})
export class StallFormComponent extends CrudFormPageBase<StallResponse> implements OnInit {
  private readonly svc = inject(StallService);
  private readonly pavSvc = inject(PavilionService);
  private readonly userPicker = inject(UserPickerService);
  private readonly fb = inject(FormBuilder);

  protected readonly listPath = '/stalls';

  readonly pavilions = signal<PavilionResponse[]>([]);
  private readonly users = signal<UserOption[]>([]);

  /** Usuarios con rol Comerciante, más el dueño actual si dejó de tenerlo. */
  readonly ownerOptions = computed<UserOption[]>(() =>
    pickUserOptions(this.users(), OWNER_ROLE, this.record()?.userId)
  );

  ngOnInit(): void {
    this.initPage();
  }

  protected override buildForm(): FormGroup {
    return this.fb.group({
      number: ['', Validators.required],
      pavilionId: [null, Validators.required],
      userId: [null]
    });
  }

  protected override loadLookups(): void {
    this.pavSvc.list(true).subscribe((res) => {
      if (res.success) this.pavilions.set(res.data);
    });
    this.userPicker.listActive().subscribe((users) => this.users.set(users));
  }

  protected override fetchById(id: number): Observable<StallResponse | null> {
    return unwrapApiOrNull(this.svc.getById(id));
  }

  protected override toFormValue(row: StallResponse) {
    return { number: row.number, pavilionId: row.pavilionId, userId: row.userId };
  }

  protected override persist(v: any, current: StallResponse | null): Observable<unknown> {
    // Cadena vacía = "sin propietario". Va como null, que es lo que el SP guarda
    // para desasignar; omitir el campo haría exactamente lo mismo, pero calla la
    // intención.
    const userId = v.userId ? +v.userId : null;

    return current
      ? unwrapApi(this.svc.update({
          id: current.id, number: v.number, pavilionId: +v.pavilionId,
          userId, status: current.status
        }))
      : unwrapApi(this.svc.create({ number: v.number, pavilionId: +v.pavilionId, userId }));
  }

  pageTitle(): string {
    return this.transloco.translate(this.isEdit() ? 'stalls.editTitle' : 'stalls.createTitle');
  }
}
