import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NetworkStateService {
  private pendingRequests = 0;
  readonly loading = signal(false);

  start(): void {
    this.pendingRequests++;
    this.loading.set(true);
  }

  finish(): void {
    this.pendingRequests = Math.max(0, this.pendingRequests - 1);
    this.loading.set(this.pendingRequests > 0);
  }
}
