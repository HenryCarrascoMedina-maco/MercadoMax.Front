import { Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

/**
 * Directiva estructural `*hasPermission`. Muestra el elemento solo si el usuario tiene
 * el permiso indicado (convención "Modulo:Accion"). Si el permiso es null/undefined/'',
 * se muestra siempre. Reutilizable por todos los maestros.
 *
 * Uso: <button *hasPermission="'Masters:Create'">…</button>
 */
@Directive({
  selector: '[hasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private readonly tpl = inject(TemplateRef<unknown>);
  private readonly vcr = inject(ViewContainerRef);
  private readonly auth = inject(AuthService);
  private shown = false;

  @Input()
  set hasPermission(permission: string | null | undefined) {
    const allowed = !permission || this.auth.hasPermission(permission);
    if (allowed && !this.shown) {
      this.vcr.createEmbeddedView(this.tpl);
      this.shown = true;
    } else if (!allowed && this.shown) {
      this.vcr.clear();
      this.shown = false;
    }
  }
}
