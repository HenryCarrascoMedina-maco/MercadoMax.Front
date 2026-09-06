import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { ActionConfig, ActionEvent } from '../../models/action-config.model';

/**
 * Botones de acción de fila (genérico, sin Angular Material).
 * Cada acción respeta su permiso vía *hasPermission. Mismos íconos/estilo `btn-icon`.
 */
@Component({
  selector: 'app-actions',
  standalone: true,
  imports: [TranslocoModule, HasPermissionDirective],
  styleUrl: './actions.component.scss',
  template: `
    <ng-container *transloco="let t">
      @for (a of actions; track a.key) {
        <button
          *hasPermission="a.permission"
          type="button"
          class="btn-icon"
          [title]="t(a.label)"
          (click)="action.emit({ key: a.key, row: row })">{{ a.icon }}</button>
      }
    </ng-container>
  `
})
export class ActionsComponent {
  @Input() actions: ActionConfig[] = [];
  @Input() row: any;
  @Output() action = new EventEmitter<ActionEvent>();
}
