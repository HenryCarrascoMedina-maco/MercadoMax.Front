import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { RoleNamePipe } from '../../shared/pipes/role-name.pipe';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslocoModule, RoleNamePipe],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent {
  sidebarCollapsed = signal(false);
  currentLang: string;

  constructor(
    public auth: AuthService,
    public theme: ThemeService,
    private transloco: TranslocoService
  ) {
    this.theme.init();
    this.currentLang = this.transloco.getActiveLang();
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  toggleTheme(): void {
    this.theme.toggle();
  }

  changeLang(event: Event): void {
    const lang = (event.target as HTMLSelectElement).value;
    this.transloco.setActiveLang(lang);
    this.currentLang = lang;
  }

  logout(): void {
    this.auth.logout();
  }
}
