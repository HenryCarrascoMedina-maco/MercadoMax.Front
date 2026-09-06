import { Component } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'app-lang-selector',
  standalone: true,
  template: `
    <select class="lang-select" [value]="currentLang" (change)="changeLang($event)">
      <option value="es">ES</option>
      <option value="en">EN</option>
    </select>
  `,
  styles: [`
    .lang-select {
      background: rgba(255,255,255,0.15);
      color: inherit;
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 12px;
      cursor: pointer;
      outline: none;
    }
    .lang-select:hover {
      background: rgba(255,255,255,0.25);
    }
    .lang-select option {
      color: #333;
      background: #fff;
    }
  `]
})
export class LangSelectorComponent {
  currentLang: string;

  constructor(private transloco: TranslocoService) {
    this.currentLang = this.transloco.getActiveLang();
  }

  changeLang(event: Event): void {
    const lang = (event.target as HTMLSelectElement).value;
    this.transloco.setActiveLang(lang);
    this.currentLang = lang;
  }
}
