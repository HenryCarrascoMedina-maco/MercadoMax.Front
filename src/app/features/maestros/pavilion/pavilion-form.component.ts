import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { PavilionService, ProductCategoryService } from '../../../core/services/master.service';
import { PavilionResponse } from '../../../core/models/master.model';
import { CrudFormPageBase } from '../../../shared/base/crud-form-page.base';
import { FormPageComponent } from '../../../shared/components/form-page/form-page.component';
import { unwrapApi, unwrapApiOrNull } from '../../../shared/utils/api-response.operators';

/** Alta y edicion de pabellones (`/nuevo`, `/:id/editar`). */
@Component({
  selector: 'app-pavilion-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoModule, FormPageComponent],
  templateUrl: './pavilion-form.component.html',
  styleUrl: './pavilion-form.component.scss'
})
export class PavilionFormComponent extends CrudFormPageBase<PavilionResponse> implements OnInit {
  private readonly svc = inject(PavilionService);
  private readonly categorySvc = inject(ProductCategoryService);
  private readonly fb = inject(FormBuilder);

  protected readonly listPath = '/pavilions';

  /** Nombres de las categorías de producto activas. */
  private readonly catalogCategories = signal<string[]>([]);

  /**
   * Opciones del desplegable. El backend guarda `category` como texto libre, así
   * que un pabellón puede traer un valor que ya no esté en el catálogo (o que se
   * escribió a mano antes). Ese valor se añade a la lista para que editar el
   * pabellón no lo borre sin avisar.
   */
  readonly categoryOptions = computed<string[]>(() => {
    const options = [...this.catalogCategories()];
    const current = this.record()?.category;
    if (current && !options.includes(current)) options.unshift(current);
    return options;
  });

  ngOnInit(): void {
    this.initPage();
  }

  protected override buildForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      category: [''],
      location: ['']
    });
  }

  protected override loadLookups(): void {
    this.categorySvc.getAll({ status: true }).subscribe((data) => {
      if (data) this.catalogCategories.set(data.map((c) => c.name));
    });
  }

  protected override fetchById(id: number): Observable<PavilionResponse | null> {
    return unwrapApiOrNull(this.svc.getById(id));
  }

  protected override toFormValue(row: PavilionResponse) {
    return { name: row.name, category: row.category, location: row.location };
  }

  protected override persist(v: any, current: PavilionResponse | null): Observable<unknown> {
    return current
      ? unwrapApi(this.svc.update({ id: current.id, name: v.name, category: v.category, location: v.location, status: current.status }))
      : unwrapApi(this.svc.create({ name: v.name, category: v.category, location: v.location }));
  }

  pageTitle(): string {
    return this.transloco.translate(this.isEdit() ? 'pavilions.editTitle' : 'pavilions.createTitle');
  }
}
