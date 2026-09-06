import { Component, input, output } from '@angular/core';

/**
 * Modal genérico (presentacional, sin Angular Material). Reusa las clases
 * .modal-overlay/.modal/.modal-header → aspecto idéntico al actual.
 * El cuerpo y el footer se proyectan vía <ng-content> (ej. un app-dynamic-form).
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  styleUrl: './modal.component.scss',
  template: `
    @if (open()) {
      <div class="modal-overlay" (click)="close.emit()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ title() }}</h2>
            <button class="btn-icon" type="button" (click)="close.emit()">✕</button>
          </div>
          <ng-content></ng-content>
        </div>
      </div>
    }
  `
})
export class ModalComponent {
  open = input(false);
  title = input('');
  close = output<void>();
}
