import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, forkJoin, map } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { ReceptionService } from '../../../core/services/reception.service';
import { GuideService } from '../../../core/services/guide.service';
import { AuthService } from '../../../core/services/auth.service';
import { ReceptionListResponse } from '../../../core/models/reception.model';
import { GuideResponse } from '../../../core/models/guide.model';
import { CrudFormPageBase } from '../../../shared/base/crud-form-page.base';
import { FormPageComponent } from '../../../shared/components/form-page/form-page.component';
import { unwrapApi } from '../../../shared/utils/api-response.operators';

/** Un puesto al que reparte la guía elegida, con lo que le toca. */
interface GuideStallSummary {
  stallNumber: string;
  pavilionName: string;
  lines: number;
  quantity: number;
}

/** Estados de guía que admiten iniciar una recepción (los que valida el SP). */
const RECEIVABLE_STATUSES = ['Pending', 'InTransit'];

/**
 * Alta de recepciones (`/nuevo`).
 *
 * La recepción es de la **guía entera**: `reception.Reception` cuelga de
 * `GuideId` y no tiene puesto, y el SP solo admite una recepción por guía. El
 * reparto por puesto ya vive en las líneas de la guía, así que aquí se muestra
 * como resumen en vez de pedirse — pedirlo daba a entender que se recepciona un
 * puesto suelto, que no es lo que hace el backend.
 *
 * La guía se elige de las que de verdad se pueden recepcionar: en estado
 * Pendiente o En tránsito y sin una recepción ya registrada.
 */
@Component({
  selector: 'app-reception-form',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe, TranslocoModule, FormPageComponent],
  templateUrl: './reception-form.component.html',
  styleUrl: './reception-form.component.scss'
})
export class ReceptionFormComponent extends CrudFormPageBase<ReceptionListResponse> implements OnInit {
  private readonly svc = inject(ReceptionService);
  private readonly guideSvc = inject(GuideService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  protected readonly listPath = '/receptions';

  /** Guías en estado recepcionable, con o sin recepción previa. */
  private readonly candidateGuides = signal<GuideResponse[]>([]);
  /** Guías que ya tienen recepción: el SP las rechaza, así que no se ofrecen. */
  private readonly guidesWithReception = signal<Set<number>>(new Set());
  readonly loadingGuides = signal(true);

  readonly availableGuides = computed<GuideResponse[]>(() =>
    this.candidateGuides().filter((g) => !this.guidesWithReception().has(g.id))
  );

  /** Guías descartadas por tener ya recepción: se dicen, no se esconden. */
  readonly alreadyReceived = computed<number>(() =>
    this.candidateGuides().length - this.availableGuides().length
  );

  /** Reparto de la guía elegida: a qué puestos descarga y cuánto. */
  readonly stallSummary = signal<GuideStallSummary[]>([]);
  readonly loadingSummary = signal(false);

  ngOnInit(): void {
    this.initPage();
  }

  protected override buildForm(): FormGroup {
    return this.fb.group({
      guideId: [null, Validators.required],
      receptionDate: [new Date().toISOString().split('T')[0], Validators.required],
      observations: ['']
    });
  }

  /**
   * Hacen falta las dos listas a la vez: la de guías recepcionables y la de las
   * que ya tienen recepción, porque el desplegable es la diferencia.
   */
  protected override loadLookups(): void {
    forkJoin({
      guides: this.guideSvc.list(undefined, undefined, undefined, 1, 200),
      receptions: this.svc.list(undefined, undefined, undefined, undefined, 1, 200)
    }).subscribe({
      next: ({ guides, receptions }) => {
        this.loadingGuides.set(false);

        this.candidateGuides.set(
          guides.success
            ? guides.data.filter((g) => RECEIVABLE_STATUSES.includes(g.guideStatus))
            : []
        );

        const taken = new Set<number>();
        if (receptions.success) {
          for (const r of receptions.data as ReceptionListResponse[]) taken.add(r.guideId);
        }
        this.guidesWithReception.set(taken);
      },
      error: () => this.loadingGuides.set(false)
    });
  }

  /** Al elegir guía se muestra a qué puestos reparte, para saber qué se recibe. */
  onGuideChange(): void {
    const guideId = this.form?.get('guideId')?.value;
    this.stallSummary.set([]);
    if (!guideId) return;

    this.loadingSummary.set(true);
    this.guideSvc.getById(+guideId).subscribe({
      next: (res) => {
        this.loadingSummary.set(false);
        if (!res.success || !res.data) return;

        const byStall = new Map<number, GuideStallSummary>();
        for (const d of res.data.details) {
          const current = byStall.get(d.destinationStallId);
          if (current) {
            current.lines++;
            current.quantity += d.quantity;
          } else {
            byStall.set(d.destinationStallId, {
              stallNumber: d.stallNumber,
              pavilionName: d.pavilionName,
              lines: 1,
              quantity: d.quantity
            });
          }
        }
        this.stallSummary.set([...byStall.values()]);
      },
      error: () => this.loadingSummary.set(false)
    });
  }

  protected override persist(v: any): Observable<unknown> {
    return unwrapApi(this.svc.create({
      guideId: +v.guideId,
      receptionDate: v.receptionDate,
      observations: v.observations || undefined,
      userId: this.auth.user()?.userId ?? 0
    }));
  }
}
