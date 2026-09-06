import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Observable, map } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { ReceptionService } from '../../../core/services/reception.service';
import { ReceptionHeaderResponse, ReceptionDetailResponse } from '../../../core/models/reception.model';
import { CrudFormPageBase } from '../../../shared/base/crud-form-page.base';
import { FormPageComponent } from '../../../shared/components/form-page/form-page.component';
import { DetailViewComponent } from '../../../shared/components/detail-view/detail-view.component';
import { DetailItem } from '../../../shared/models/detail-item.model';

/**
 * Ficha de una recepción (`/:id`): cabecera y líneas recibidas.
 *
 * El endpoint devuelve `{ header, details }`, así que la base tipa sobre la
 * cabecera (es la que trae el `id`) y las líneas se guardan aparte.
 */
@Component({
  selector: 'app-reception-detail',
  standalone: true,
  imports: [TranslocoModule, FormPageComponent, DetailViewComponent],
  templateUrl: './reception-detail.component.html',
  styleUrl: './reception-detail.component.scss'
})
export class ReceptionDetailComponent extends CrudFormPageBase<ReceptionHeaderResponse> implements OnInit {
  private readonly svc = inject(ReceptionService);
  protected readonly listPath = '/receptions';

  readonly details = signal<ReceptionDetailResponse[]>([]);

  readonly items = computed<DetailItem[]>(() => {
    const row = this.record();
    if (!row) return [];
    return [
      { label: 'common.id', value: row.id, type: 'mono' },
      { label: 'receptions.guide', value: row.guideNumber },
      { label: 'receptions.stall', value: row.stallCode },
      { label: 'receptions.receptionDate', value: row.receptionDate, type: 'date' },
      { label: 'common.status', value: row.receptionStatus },
      { label: 'common.createdAt', value: row.createdAt, type: 'date' },
      { label: 'common.observations', value: row.observations, span: true }
    ];
  });

  ngOnInit(): void {
    this.initPage();
  }

  protected override fetchById(id: number): Observable<ReceptionHeaderResponse | null> {
    return this.svc.getById(id).pipe(
      map((res) => {
        if (!res?.success || !res.data) return null;
        this.details.set(res.data.details ?? []);
        return res.data.header;
      })
    );
  }
}
