import { Component, OnInit, computed, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { UserService } from '../../../core/services/user.service';
import { UserResponse } from '../../../core/models/auth.model';
import { CrudFormPageBase } from '../../../shared/base/crud-form-page.base';
import { FormPageComponent } from '../../../shared/components/form-page/form-page.component';
import { DetailViewComponent } from '../../../shared/components/detail-view/detail-view.component';
import { DetailItem } from '../../../shared/models/detail-item.model';
import { roleLabels } from '../../../shared/utils/role-name.util';

/** Ficha de un usuario (`/:id`). */
@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [TranslocoModule, FormPageComponent, DetailViewComponent],
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.scss'
})
export class UserDetailComponent extends CrudFormPageBase<UserResponse> implements OnInit {
  private readonly userService = inject(UserService);
  protected readonly listPath = '/users';

  readonly fullName = computed(() => {
    const row = this.record();
    return row ? `${row.firstName} ${row.lastName}` : '';
  });

  readonly items = computed<DetailItem[]>(() => {
    const row = this.record();
    if (!row) return [];
    return [
      { label: 'common.id', value: row.id, type: 'mono' },
      { label: 'auth.firstName', value: row.firstName },
      { label: 'auth.lastName', value: row.lastName },
      { label: 'common.email', value: row.email },
      { label: 'common.phone', value: row.phone },
      { label: 'common.status', value: row.status, type: 'status' },
      { label: 'users.rolesSection', value: roleLabels(this.transloco, row.roles), span: true }
    ];
  });

  ngOnInit(): void {
    this.initPage();
  }

  protected override fetchById(id: number): Observable<UserResponse | null> {
    return this.userService.getById(id).pipe(map((res) => (res.success ? res.data : null)));
  }
}
