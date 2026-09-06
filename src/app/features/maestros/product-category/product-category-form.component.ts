import { Component, OnInit, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { ProductCategoryService } from '../../../core/services/master.service';
import { ProductCategoryResponse, CreateProductCategoryRequest } from '../../../core/models/master.model';
import { CrudFormPageBase } from '../../../shared/base/crud-form-page.base';
import { FormPageComponent } from '../../../shared/components/form-page/form-page.component';
import { DynamicFormComponent } from '../../../shared/components/dynamic-form/dynamic-form.component';
import { FormFieldConfig } from '../../../shared/models/form-field-config.model';

/** Alta y edición de categorías, a página completa (`/nuevo`, `/:id/editar`). */
@Component({
  selector: 'app-product-category-form',
  standalone: true,
  imports: [TranslocoModule, FormPageComponent, DynamicFormComponent],
  templateUrl: './product-category-form.component.html',
  styleUrl: './product-category-form.component.scss'
})
export class ProductCategoryFormComponent
  extends CrudFormPageBase<ProductCategoryResponse>
  implements OnInit {

  protected readonly service = inject(ProductCategoryService);
  protected readonly listPath = '/product-categories';

  readonly formFields: FormFieldConfig[] = [
    { key: 'name', label: 'common.name', type: 'text', required: true, placeholder: 'categories.namePlaceholder' },
    { key: 'description', label: 'common.descriptionOptional', type: 'textarea', placeholder: 'common.description' }
  ];

  ngOnInit(): void {
    this.initPage();
  }

  protected override fetchById(id: number): Observable<ProductCategoryResponse | null> {
    return this.service.getById(id);
  }

  protected override persist(value: any, current: ProductCategoryResponse | null): Observable<unknown> {
    return current
      ? this.service.update(current.id, { ...current, ...value })
      : this.service.create(value as CreateProductCategoryRequest);
  }

  /** Título de la página según el modo. */
  pageTitle(): string {
    return this.transloco.translate(this.isEdit() ? 'categories.editTitle' : 'categories.createTitle');
  }

  /** Valores que recibe el formulario dinámico (null al crear). */
  formValue(): Partial<ProductCategoryResponse> | null {
    const row = this.record();
    return row ? { name: row.name, description: row.description } : null;
  }

  /**
   * El formulario dinámico gestiona su propio FormGroup, así que `submit()` de la
   * base (que trabaja sobre `this.form`) no aplica: aquí llega el valor ya validado.
   */
  onSubmit(value: any): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.persist(value, this.record()).subscribe({
      next: () => {
        this.saving.set(false);
        this.flash.set(this.transloco.translate('common.savedOk'));
        this.goToList();
      },
      error: (err) => { this.saving.set(false); this.showError(err); }
    });
  }
}
