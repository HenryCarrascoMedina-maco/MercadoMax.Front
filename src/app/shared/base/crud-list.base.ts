import { inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { BaseCrudService } from '../../core/services/base-crud.service';
import { ErrorHandlerService } from '../../core/services/error-handler.service';
import { FlashService } from '../../core/services/flash.service';
import { TableColumn } from '../models/table-column.model';
import { ActionConfig, ActionEvent } from '../models/action-config.model';

/**
 * Base reutilizable para listados CRUD de maestros. Orquesta listado/búsqueda/
 * eliminar/toggle con signals y manejo de errores centralizado.
 * Cada maestro la extiende y declara: service, listPath, columns, rowActions.
 *
 * Crear/ver/editar ya no abren un modal: son rutas hijas del listado
 * (`/nuevo`, `/:id`, `/:id/editar`). El aviso de "Guardado correctamente" llega
 * desde la página de formulario vía `FlashService`.
 */
export abstract class CrudListBase<TDto extends { id: number }, TCreate = any, TUpdate = any> {
  protected abstract readonly service: BaseCrudService<TDto, TCreate, TUpdate, number>;
  /** Ruta del listado, ej. '/product-categories'. Base de las rutas hijas. */
  protected abstract readonly listPath: string;
  abstract readonly columns: TableColumn<TDto>[];
  abstract readonly rowActions: ActionConfig<TDto>[];

  protected readonly errorHandler = inject(ErrorHandlerService);
  protected readonly transloco = inject(TranslocoService);
  protected readonly router = inject(Router);
  protected readonly flash = inject(FlashService);

  readonly rows = signal<TDto[]>([]);
  readonly loading = signal(false);
  readonly search = signal('');

  readonly confirmOpen = signal(false);
  readonly confirmMessage = signal('');
  private readonly pendingDelete = signal<TDto | null>(null);

  readonly message = signal<{ text: string; type: 'success' | 'error' } | null>(null);

  protected loadData(): void {
    this.loading.set(true);
    this.service.getAll(this.search() ? { search: this.search() } : undefined).subscribe({
      next: (data) => { this.rows.set(data ?? []); this.loading.set(false); },
      error: (err) => { this.loading.set(false); this.showError(err); }
    });
  }

  /** Recoge el aviso que dejó la página de formulario al volver. */
  protected consumeFlash(): void {
    const pending = this.flash.consume();
    if (pending) {
      this.message.set(pending);
      this.autoClear();
    }
  }

  onSearch(value: string): void {
    this.search.set(value);
    this.loadData();
  }

  goCreate(): void { this.router.navigate([this.listPath, 'nuevo']); }
  goView(row: TDto): void { this.router.navigate([this.listPath, row.id]); }
  goEdit(row: TDto): void { this.router.navigate([this.listPath, row.id, 'editar']); }

  onAction(ev: ActionEvent<TDto>): void {
    switch (ev.key) {
      case 'view': this.goView(ev.row); break;
      case 'edit': this.goEdit(ev.row); break;
      case 'delete': this.askDelete(ev.row); break;
      case 'toggleStatus': this.toggleStatus(ev.row); break;
    }
  }

  askDelete(row: TDto): void {
    this.pendingDelete.set(row);
    this.confirmMessage.set(this.transloco.translate('common.deleteConfirm', { name: (row as any).name ?? '' }));
    this.confirmOpen.set(true);
  }

  cancelDelete(): void { this.confirmOpen.set(false); this.pendingDelete.set(null); }

  confirmDelete(): void {
    const row = this.pendingDelete();
    this.confirmOpen.set(false);
    this.pendingDelete.set(null);
    if (!row) return;
    this.service.delete(row.id).subscribe({
      next: () => { this.showOk('common.deletedOk'); this.loadData(); },
      error: (err) => this.showError(err)
    });
  }

  toggleStatus(row: TDto): void {
    this.service.toggleStatus(row.id).subscribe({
      next: () => { this.showOk('common.statusOk'); this.loadData(); },
      error: (err) => this.showError(err)
    });
  }

  protected showOk(key: string): void {
    this.message.set({ text: this.transloco.translate(key), type: 'success' });
    this.autoClear();
  }

  protected showError(err: HttpErrorResponse): void {
    this.message.set({ text: this.errorHandler.getMessage(err), type: 'error' });
    this.autoClear();
  }

  private autoClear(): void {
    setTimeout(() => this.message.set(null), 4000);
  }
}
