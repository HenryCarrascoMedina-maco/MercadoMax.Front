import { Injectable, NgZone } from '@angular/core';

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 60 * 1000; // 5 hours

const ACTIVITY_EVENTS: string[] = [
  'mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'
];

@Injectable({ providedIn: 'root' })
export class InactivityService {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private onTimeoutCallback: (() => void) | null = null;
  private readonly boundReset = () => this.resetTimer();

  constructor(private ngZone: NgZone) {}

  start(onTimeout: () => void): void {
    this.onTimeoutCallback = onTimeout;
    this.stop();
    this.ngZone.runOutsideAngular(() => {
      ACTIVITY_EVENTS.forEach(ev =>
        document.addEventListener(ev, this.boundReset, { passive: true })
      );
      this.scheduleTimer();
    });
  }

  stop(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    ACTIVITY_EVENTS.forEach(ev =>
      document.removeEventListener(ev, this.boundReset)
    );
    this.onTimeoutCallback = null;
  }

  private scheduleTimer(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.ngZone.run(() => this.onTimeoutCallback?.());
    }, INACTIVITY_TIMEOUT_MS);
  }

  private resetTimer(): void {
    this.scheduleTimer();
  }
}
