import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, map } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { SettlementService } from '../../../core/services/transport.service';
import { GuideService } from '../../../core/services/guide.service';
import { LogisticUnitService } from '../../../core/services/master.service';
import {
  SettlementHeaderResponse, SettlementDetailResponse,
  CreateSettlementDetailRequest, UpdateSettlementStatusRequest
} from '../../../core/models/transport.model';
import { GuideResponse } from '../../../core/models/guide.model';
import { LogisticUnitResponse } from '../../../core/models/master.model';
import { CrudFormPageBase } from '../../../shared/base/crud-form-page.base';
import { FormPageComponent } from '../../../shared/components/form-page/form-page.component';

/**
 * Ficha de una liquidación (`/:id`). Es la pantalla de trabajo: muestra la
 * cabecera, sus líneas, permite añadir y quitar líneas y marcarla como pagada.
 *
 * Era el modal ancho de "gestionar"; a página completa la tabla de líneas y el
 * alta rápida caben sin scroll anidado.
 */
@Component({
  selector: 'app-settlement-detail',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, DecimalPipe, TranslocoModule, FormPageComponent],
  templateUrl: './settlement-detail.component.html',
  styleUrl: './settlement-detail.component.scss'
})
export class SettlementDetailComponent extends CrudFormPageBase<SettlementHeaderResponse> implements OnInit {
  private readonly settlementSvc = inject(SettlementService);
  private readonly guideSvc = inject(GuideService);
  private readonly luSvc = inject(LogisticUnitService);
  private readonly fb = inject(FormBuilder);

  protected readonly listPath = '/settlements';

  readonly details = signal<SettlementDetailResponse[]>([]);
  readonly guides = signal<GuideResponse[]>([]);
  readonly logisticUnits = signal<LogisticUnitResponse[]>([]);

  detailForm!: FormGroup;

  ngOnInit(): void {
    this.detailForm = this.fb.group({
      guideId: [null, Validators.required],
      logisticUnitId: [null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.01)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]]
    });
    this.initPage();
  }

  protected override loadLookups(): void {
    this.luSvc.list(true).subscribe((res) => {
      if (res.success) this.logisticUnits.set(res.data);
    });
    // Las guías dependen del transportista de la liquidación, que aún no se
    // conoce aquí. Se cargan en `afterRecordLoaded`.
  }

  /**
   * Guías que se pueden liquidar: las de este transportista y que no estén
   * anuladas.
   *
   * Antes se pedían todas las que estuvieran `InTransit`, sin mirar de quién
   * eran. Eso dejaba elegir una guía de otro transportista —pagarle un viaje
   * que no hizo— y a la vez escondía las ya entregadas, que son justo las que
   * normalmente toca liquidar. Ahora el desplegable ofrece exactamente lo que
   * `SP_CREATE_SETTLEMENT_DETAIL` acepta, así que no hay opción a la vista que
   * el backend vaya a rechazar.
   */
  protected override afterRecordLoaded(row: SettlementHeaderResponse): void {
    if (this.isView() && row.settlementStatus !== 'Pending') return;

    this.guideSvc.list(undefined, undefined, row.carrierId, 1, 200).subscribe((res) => {
      if (!res.success) return;
      this.guides.set(res.data.filter((g) => g.guideStatus !== 'Voided'));
    });
  }

  protected override fetchById(id: number): Observable<SettlementHeaderResponse | null> {
    return this.settlementSvc.getById(id).pipe(
      map((res) => {
        if (!res?.success || !res.data) return null;
        this.details.set(res.data.details ?? []);
        return res.data.header;
      })
    );
  }

  isPending(): boolean { return this.record()?.settlementStatus === 'Pending'; }

  private refresh(): void {
    const id = this.recordId();
    if (id === null) return;
    this.fetchById(id).subscribe((header) => { if (header) this.record.set(header); });
  }

  addDetail(): void {
    if (this.detailForm.invalid) { this.detailForm.markAllAsTouched(); return; }
    const header = this.record();
    if (!header) return;

    const req: CreateSettlementDetailRequest = {
      settlementId: header.id,
      guideId: +this.detailForm.value.guideId,
      logisticUnitId: +this.detailForm.value.logisticUnitId,
      quantity: +this.detailForm.value.quantity,
      unitPrice: +this.detailForm.value.unitPrice
    };
    this.settlementSvc.createDetail(req).subscribe({
      next: (res) => {
        if (!res.success) { this.message.set({ text: res.message, type: 'error' }); return; }
        this.detailForm.reset({ quantity: 1, unitPrice: 0 });
        this.refresh();
      },
      error: (err) => this.showError(err)
    });
  }

  removeDetail(detailId: number): void {
    if (!confirm(this.transloco.translate('settlements.deleteLineConfirm'))) return;
    this.settlementSvc.deleteDetail(detailId).subscribe({
      next: (res) => {
        if (!res.success) { this.message.set({ text: res.message, type: 'error' }); return; }
        this.refresh();
      },
      error: (err) => this.showError(err)
    });
  }

  markAsPaid(): void {
    const header = this.record();
    if (!header) return;

    // Una liquidación pagada ya no se puede reabrir ni modificar, así que el
    // paso pide confirmación en vez de dispararse al primer clic.
    if (this.details().length === 0) {
      this.message.set({ text: this.transloco.translate('settlements.cannotPayEmpty'), type: 'error' });
      return;
    }
    if (!confirm(this.transloco.translate('settlements.markAsPaidConfirm'))) return;

    const req: UpdateSettlementStatusRequest = { id: header.id, settlementStatus: 'Paid' };
    this.settlementSvc.updateStatus(req).subscribe({
      next: (res) => {
        if (!res.success) { this.message.set({ text: res.message, type: 'error' }); return; }
        this.refresh();
      },
      error: (err) => this.showError(err)
    });
  }
}
