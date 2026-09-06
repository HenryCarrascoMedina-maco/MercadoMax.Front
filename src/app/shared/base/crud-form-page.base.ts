import { inject, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, Observable } from 'rxjs';
import { TranslocoService } from '@jsverse/transloco';
import { ErrorHandlerService } from '../../core/services/error-handler.service';
import { FlashService } from '../../core/services/flash.service';

export type FormPageMode = 'create' | 'edit' | 'view';

/**
 * Base de las páginas ruteadas de crear/ver/editar. Es la contraparte de
 * `CrudListBase`: esta se ocupa de una sola ficha, no del listado.
 *
 * El modo llega por `data.mode` de la ruta y el id por `:id`, así que la misma
 * clase sirve para las tres pantallas:
 *
 *   { path: 'nuevo',      component: XFormComponent,   data: { mode: 'create' } }
 *   { path: ':id',        component: XDetailComponent, data: { mode: 'view' } }
 *   { path: ':id/editar', component: XFormComponent,   data: { mode: 'edit' } }
 *
 * No depende de `BaseCrudService`: en MercadoMAX solo `ProductCategoryService` lo
 * extiende y el resto tiene firmas propias (`update(req)` en vez de
 * `update(id, req)`, respuestas envueltas en `ApiResponse`). Por eso el acceso a
 * datos entra por `fetchById`/`persist`, que cada feature adapta en tres líneas.
 *
 * Al guardar deja el aviso en `FlashService` y vuelve al listado, que lo muestra.
 */
export abstract class CrudFormPageBase<TDto extends { id: number }> {
  /** Ruta del listado, ej. '/product-categories'. */
  protected abstract readonly listPath: string;

  protected readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);
  protected readonly errorHandler = inject(ErrorHandlerService);
  protected readonly transloco = inject(TranslocoService);
  protected readonly flash = inject(FlashService);

  readonly mode = signal<FormPageMode>('create');
  readonly recordId = signal<number | null>(null);
  readonly record = signal<TDto | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly message = signal<{ text: string; type: 'success' | 'error' } | null>(null);

  /** FormGroup de la ficha. Las páginas de solo ver no lo usan. */
  form?: FormGroup;

  isCreate(): boolean { return this.mode() === 'create'; }
  isEdit(): boolean { return this.mode() === 'edit'; }
  isView(): boolean { return this.mode() === 'view'; }

  /**
   * Arranca la página: resuelve modo e id, construye el formulario y carga el
   * registro si hace falta. Llamar desde `ngOnInit`.
   */
  protected initPage(): void {
    this.mode.set((this.route.snapshot.data['mode'] as FormPageMode) ?? 'create');

    const rawId = this.route.snapshot.paramMap.get('id');
    const id = rawId !== null ? Number(rawId) : NaN;

    if (!this.isCreate()) {
      // Un id no numérico en la URL no debe acabar en una llamada `/NaN` al backend.
      if (!Number.isInteger(id) || id <= 0) {
        this.goToList();
        return;
      }
      this.recordId.set(id);
    }

    if (!this.isView()) this.form = this.buildForm();

    this.loadLookups();

    if (this.isCreate()) {
      this.afterInit();
      return;
    }

    this.loading.set(true);
    this.fetchById(id).subscribe({
      next: (row) => {
        this.loading.set(false);
        if (!row) { this.goToList(); return; }
        this.record.set(row);
        this.form?.patchValue(this.toFormValue(row));
        this.afterRecordLoaded(row);
        this.afterInit();
      },
      error: (err) => { this.loading.set(false); this.showError(err); }
    });
  }

  /** Trae el registro por id, ya desenvuelto (null si no existe). */
  protected fetchById(_id: number): Observable<TDto | null> { return EMPTY; }

  /**
   * Guarda. `current` es null al crear. Solo importa que el observable complete;
   * la navegación y el aviso los pone la base.
   */
  protected persist(_value: any, _current: TDto | null): Observable<unknown> { return EMPTY; }

  /**
   * Construye el FormGroup vacío. Solo se llama en crear/editar, así que las
   * páginas de solo ver no necesitan implementarlo.
   */
  protected buildForm(): FormGroup | undefined { return undefined; }

  /** Carga de catálogos para los `<select>`. Se llama antes de traer el registro. */
  protected loadLookups(): void {}

  /** Gancho tras cargar el registro (ej. cargar dependientes del id). */
  protected afterRecordLoaded(_row: TDto): void {}

  /** Gancho al final del arranque, con el formulario ya parcheado. */
  protected afterInit(): void {}

  /** Valores del formulario a partir del registro. Por defecto, el registro entero. */
  protected toFormValue(row: TDto): any { return row; }

  submit(): void {
    if (!this.form) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.saving()) return;

    this.saving.set(true);
    this.persist(this.form.getRawValue(), this.record()).subscribe({
      next: () => {
        this.saving.set(false);
        this.flash.set(this.transloco.translate('common.savedOk'));
        this.goToList();
      },
      error: (err) => { this.saving.set(false); this.showError(err); }
    });
  }

  cancel(): void { this.goToList(); }

  goToList(): void { this.router.navigate([this.listPath]); }

  goToEdit(): void {
    const id = this.recordId();
    if (id !== null) this.router.navigate([this.listPath, id, 'editar']);
  }

  protected showError(err: HttpErrorResponse): void {
    this.message.set({ text: this.errorHandler.getMessage(err), type: 'error' });
  }

  /** Clave i18n del error a mostrar bajo un control (o null si no aplica). */
  errorKey(controlName: string): string | null {
    const control = this.form?.get(controlName);
    if (!control || control.valid || !(control.touched || control.dirty)) return null;
    return control.errors?.['required'] ? 'common.fieldRequired' : 'common.invalidField';
  }
}
