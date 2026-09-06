import { Component, input, output } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

/**
 * Diálogo de confirmación genérico (reemplaza window.confirm()). Mismo estilo de modal.
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [TranslocoModule],
  styleUrl: './confirm-dialog.component.scss',
  template: `
    <ng-container *transloco="let t">
      @if (open()) {
        <div class="modal-overlay" (click)="cancel.emit()">
          <div class="modal confirm" (click)="$event.stopPropagation()">
            <div class="modal-header"><h2>{{ title() || t('common.deleteTitle') }}</h2></div>
            <div class="modal-body">{{ message() }}</div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="cancel.emit()">{{ t('common.cancel') }}</button>
              <button type="button" class="btn btn-primary" (click)="confirm.emit()">{{ t('common.confirm') }}</button>
            </div>
          </div>
        </div>
      }
    </ng-container>
  `
})
export class ConfirmDialogComponent {
  open = input(false);
  title = input('');
  message = input('');
  confirm = output<void>();
  cancel = output<void>();
}
