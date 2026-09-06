import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, map } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { AccountPayableService } from '../../../core/services/finance.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  AccountPayableHeaderResponse, PaymentResponse, CreatePaymentRequest
} from '../../../core/models/finance.model';
import { CrudFormPageBase } from '../../../shared/base/crud-form-page.base';
import { FormPageComponent } from '../../../shared/components/form-page/form-page.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';

/**
 * Cuenta por pagar. Dos rutas, una plantilla — igual que el modal servía a "ver"
 * y "registrar pago" con un flag:
 *
 *   `/:id`         → solo lectura
 *   `/:id/editar`  → registra pagos
 */
@Component({
  selector: 'app-account-payable-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule, DatePipe, DecimalPipe, TranslocoModule,
    FormPageComponent, IconComponent
  ],
  templateUrl: './account-payable-detail.component.html',
  styleUrl: './account-payable-detail.component.scss'
})
export class AccountPayableDetailComponent
  extends CrudFormPageBase<AccountPayableHeaderResponse>
  implements OnInit {

  private readonly apSvc = inject(AccountPayableService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  protected readonly listPath = '/account-payables';

  readonly payments = signal<PaymentResponse[]>([]);

  readonly paymentsTotal = computed(() =>
    this.payments().reduce((acc, p) => acc + p.amount, 0)
  );

  paymentForm!: FormGroup;

  ngOnInit(): void {
    this.paymentForm = this.fb.group({
      amount: [0, [Validators.required, Validators.min(0.01)]],
      paymentMethod: ['Cash', Validators.required],
      operationNumber: [''],
      observations: ['']
    });
    this.initPage();
  }

  protected override fetchById(id: number): Observable<AccountPayableHeaderResponse | null> {
    return this.apSvc.getById(id).pipe(
      map((res) => {
        if (!res?.success || !res.data) return null;
        this.payments.set(res.data.payments ?? []);
        return res.data.header;
      })
    );
  }

  /** Pagar el saldo entero es el caso más común: se prellena con él. */
  protected override afterRecordLoaded(row: AccountPayableHeaderResponse): void {
    if (!this.isView()) this.paymentForm.patchValue({ amount: row.balance });
  }

  isPaid(): boolean { return this.record()?.accountStatus === 'Paid'; }

  paidPercent(item: { totalAmount: number; paidAmount: number }): number {
    if (item.totalAmount <= 0) return 0;
    return Math.min(100, Math.round((item.paidAmount / item.totalAmount) * 100));
  }

  /** Días hasta el vencimiento: negativo si ya venció, null si no hay fecha. */
  daysToDue(dueDate?: string): number | null {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    if (isNaN(due.getTime())) return null;
    const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    return Math.round((midnight(due) - midnight(new Date())) / 86_400_000);
  }

  /**
   * Etiqueta de vencimiento lista para i18n. Objeto y no número porque en el
   * template `@if (0; as d)` caería en el `@else`.
   */
  dueInfo(dueDate?: string): { key: 'overdueBy' | 'dueToday' | 'dueIn'; days: number } | null {
    const d = this.daysToDue(dueDate);
    if (d === null) return null;
    if (d === 0) return { key: 'dueToday', days: 0 };
    return d < 0 ? { key: 'overdueBy', days: -d } : { key: 'dueIn', days: d };
  }

  isOverdue(item: { dueDate?: string; accountStatus: string }): boolean {
    if (item.accountStatus === 'Paid') return false;
    const d = this.daysToDue(item.dueDate);
    return d !== null && d < 0;
  }

  private refresh(): void {
    const id = this.recordId();
    if (id === null) return;
    this.fetchById(id).subscribe((header) => {
      if (!header) return;
      this.record.set(header);
      this.paymentForm.patchValue({ amount: header.balance });
    });
  }

  addPayment(): void {
    if (this.paymentForm.invalid) { this.paymentForm.markAllAsTouched(); return; }
    const header = this.record();
    if (!header) return;

    const req: CreatePaymentRequest = {
      accountPayableId: header.id,
      amount: +this.paymentForm.value.amount,
      paymentMethod: this.paymentForm.value.paymentMethod,
      operationNumber: this.paymentForm.value.operationNumber || undefined,
      observations: this.paymentForm.value.observations || undefined,
      userId: this.auth.user()?.userId ?? 0
    };
    this.apSvc.createPayment(req).subscribe({
      next: (res) => {
        if (!res.success) { this.message.set({ text: res.message, type: 'error' }); return; }
        this.paymentForm.reset({ paymentMethod: 'Cash', amount: 0 });
        this.refresh();
      },
      error: (err) => this.showError(err)
    });
  }
}
