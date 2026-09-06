import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { CarrierService } from '../../../core/services/transport.service';
import { CarrierResponse } from '../../../core/models/transport.model';
import {
  UserChoices, UserOption, UserPickerService, splitUserOptions
} from '../../../core/services/user-picker.service';
import { CrudFormPageBase } from '../../../shared/base/crud-form-page.base';
import { FormPageComponent } from '../../../shared/components/form-page/form-page.component';
import { unwrapApi, unwrapApiOrNull } from '../../../shared/utils/api-response.operators';

/** Rol que debe tener el usuario vinculado a un transportista. */
const CARRIER_ROLE = 'Carrier';

/**
 * Alta y edición de transportistas (`/nuevo`, `/:id/editar`).
 *
 * Nombre y apellido no se piden: los trae la cuenta de usuario elegida, que es
 * donde ya están. Se muestran deshabilitados para que se vea de dónde salen y
 * para que no puedan divergir de la cuenta. Lo propio del transportista —
 * documento, licencia y teléfono— sí se escribe aquí.
 */
@Component({
  selector: 'app-carrier-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoModule, FormPageComponent],
  templateUrl: './carrier-form.component.html',
  styleUrl: './carrier-form.component.scss'
})
export class CarrierFormComponent extends CrudFormPageBase<CarrierResponse> implements OnInit {
  private readonly svc = inject(CarrierService);
  private readonly userPicker = inject(UserPickerService);
  private readonly fb = inject(FormBuilder);

  protected readonly listPath = '/carriers';

  private readonly users = signal<UserOption[]>([]);

  /** Cuentas ya usadas por otro transportista activo: id de usuario → aviso. */
  private readonly takenBy = signal<Map<number, string>>(new Map());

  /**
   * Una cuenta es una persona y una persona es un transportista, así que el
   * usuario es de un solo uso: los ya vinculados se listan al final, en gris.
   */
  readonly choices = computed<UserChoices>(() =>
    splitUserOptions(this.users(), CARRIER_ROLE, this.record()?.userId, this.takenBy())
  );

  ngOnInit(): void {
    this.initPage();
  }

  protected override buildForm(): FormGroup {
    return this.fb.group({
      userId: [null, Validators.required],
      // Heredados de la cuenta: van deshabilitados, y `getRawValue()` los envía igual.
      firstName: [{ value: '', disabled: true }],
      lastName: [{ value: '', disabled: true }],
      documentId: ['', Validators.required],
      licenseNumber: ['', Validators.required],
      phone: ['']
    });
  }

  protected override loadLookups(): void {
    this.userPicker.listActive().subscribe((users) => {
      this.users.set(users);
      // En edición el usuario ya viene puesto: al llegar la lista se refresca el
      // nombre, para que no se quede uno viejo si la cuenta se renombró.
      this.applyUser(this.form?.get('userId')?.value, { overwritePhone: false });
    });

    // Solo los activos: dar de baja un transportista libera su cuenta, igual que
    // hace el índice único de la base (filtrado por Status = 1).
    this.svc.list(true).subscribe((res) => {
      if (!res.success) return;
      const taken = new Map<number, string>();
      for (const carrier of res.data) {
        if (carrier.userId) taken.set(carrier.userId, this.transloco.translate('carriers.alreadyCarrier'));
      }
      this.takenBy.set(taken);
    });
  }

  protected override fetchById(id: number): Observable<CarrierResponse | null> {
    return unwrapApiOrNull(this.svc.getById(id));
  }

  protected override toFormValue(row: CarrierResponse) {
    return {
      userId: row.userId,
      firstName: row.firstName,
      lastName: row.lastName,
      documentId: row.documentId,
      licenseNumber: row.licenseNumber,
      phone: row.phone
    };
  }

  /**
   * La lista de usuarios y el registro llegan por su cuenta y en cualquier orden.
   * Con la llamada aquí y la de `loadLookups`, el nombre acaba sincronizado gane
   * quien gane la carrera.
   */
  protected override afterInit(): void {
    this.applyUser(this.form?.get('userId')?.value, { overwritePhone: false });
  }

  /** Al cambiar de usuario, el nombre se retrae de la cuenta. */
  onUserChange(): void {
    this.applyUser(this.form?.get('userId')?.value, { overwritePhone: true });
  }

  /**
   * Copia los datos de la cuenta al formulario.
   *
   * El teléfono solo se propone: es el de la cuenta, y el de contacto del
   * transportista puede ser otro. Por eso no se pisa uno que ya esté escrito.
   */
  private applyUser(userId: number | string | null, opts: { overwritePhone: boolean }): void {
    if (!this.form || !userId) return;

    const user = this.users().find((u) => u.id === +userId);
    if (!user) return;

    this.form.patchValue({ firstName: user.firstName, lastName: user.lastName });

    const phone = this.form.get('phone');
    if (phone && user.phone && (opts.overwritePhone || !phone.value)) {
      phone.setValue(user.phone);
    }
  }

  /** El usuario del registro que se edita, para marcarlo como «actual». */
  isCurrentUser(id: number): boolean {
    return this.isEdit() && this.record()?.userId === id;
  }

  protected override persist(v: any, current: CarrierResponse | null): Observable<unknown> {
    const payload = {
      firstName: v.firstName,
      lastName: v.lastName,
      documentId: v.documentId,
      phone: v.phone,
      licenseNumber: v.licenseNumber,
      userId: +v.userId
    };

    return current
      ? unwrapApi(this.svc.update({ id: current.id, ...payload, status: current.status }))
      : unwrapApi(this.svc.create(payload));
  }

  pageTitle(): string {
    return this.transloco.translate(this.isEdit() ? 'carriers.editTitle' : 'carriers.createTitle');
  }
}
