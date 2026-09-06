import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { FormFieldConfig } from '../../models/form-field-config.model';

/**
 * Formulario dinámico por configuración (sin Angular Material). Construye un reactive form
 * a partir de `fields`. Render con clases .form-group/.modal-body/.modal-footer → aspecto idéntico.
 * Modos create/edit/view (view deshabilita los controles).
 */
@Component({
  selector: 'app-dynamic-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoModule],
  styleUrl: './dynamic-form.component.scss',
  template: `
    <ng-container *transloco="let t">
      @if (form) {
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="page-body">
           <div class="page-grid">
            @for (f of fields; track f.key) {
              <div class="form-group" [class.span-2]="f.type === 'textarea'">
                <label>{{ t(f.label) }}@if (f.required) {<span class="req" title="Requerido">*</span>}</label>
                @switch (f.type) {
                  @case ('textarea') {
                    <textarea [formControlName]="f.key" [placeholder]="f.placeholder ? t(f.placeholder) : ''"></textarea>
                  }
                  @case ('select') {
                    <select [formControlName]="f.key">
                      @for (o of f.options || []; track o.value) {
                        <option [value]="o.value">{{ o.label }}</option>
                      }
                    </select>
                  }
                  @case ('checkbox') {
                    <input type="checkbox" [formControlName]="f.key" />
                  }
                  @default {
                    <input [type]="f.type" [formControlName]="f.key" [placeholder]="f.placeholder ? t(f.placeholder) : ''" />
                  }
                }
                @if (errorKey(f); as ek) { <span class="field-error">{{ t(ek) }}</span> }
              </div>
            }
           </div>
          </div>
          <div class="page-footer">
            @if (mode !== 'view') {
              <button type="button" class="btn btn-secondary" (click)="formCancel.emit()">{{ t('common.cancel') }}</button>
              <button type="submit" class="btn btn-primary" [disabled]="form.invalid">{{ t('common.save') }}</button>
            } @else {
              <button type="button" class="btn btn-secondary" (click)="formCancel.emit()">{{ t('common.close') }}</button>
            }
          </div>
        </form>
      }
    </ng-container>
  `
})
export class DynamicFormComponent {
  private readonly fb = inject(FormBuilder);

  form?: FormGroup;
  private _fields: FormFieldConfig[] = [];
  private _value: any = null;
  private _mode: 'create' | 'edit' | 'view' = 'create';

  @Input({ required: true })
  set fields(value: FormFieldConfig[]) { this._fields = value ?? []; this.build(); }
  get fields() { return this._fields; }

  @Input()
  set value(v: any) {
    this._value = v;
    if (this.form) {
      this.form.reset();
      if (v) this.form.patchValue(v);
      this.applyMode();
    }
  }

  @Input()
  set mode(m: 'create' | 'edit' | 'view') { this._mode = m; this.applyMode(); }
  get mode() { return this._mode; }

  @Output() formSubmit = new EventEmitter<any>();
  @Output() formCancel = new EventEmitter<void>();

  private build(): void {
    const group: Record<string, any> = {};
    for (const f of this._fields) {
      const initial = f.type === 'checkbox' ? false : '';
      group[f.key] = [initial, f.required ? [Validators.required] : []];
    }
    this.form = this.fb.group(group);
    if (this._value) this.form.patchValue(this._value);
    this.applyMode();
  }

  private applyMode(): void {
    if (!this.form) return;
    if (this._mode === 'view') this.form.disable();
    else this.form.enable();
  }

  submit(): void {
    if (this.form && this.form.valid) this.formSubmit.emit(this.form.value);
  }

  /** Clave i18n del mensaje de error a mostrar bajo un campo (o null si no aplica). */
  errorKey(field: FormFieldConfig): string | null {
    const control = this.form?.get(field.key);
    if (!control || control.valid || !(control.touched || control.dirty)) return null;
    if (control.errors?.['required']) return 'common.fieldRequired';
    return 'common.invalidField';
  }
}
