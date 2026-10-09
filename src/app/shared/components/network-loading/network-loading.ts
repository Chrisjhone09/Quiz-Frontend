import { Component, inject } from '@angular/core';
import { NetworkStateService } from '../../services/network-state.service';

@Component({
  selector: 'app-network-loading',
  template: `@if (network.loading()) { <div class="network-loading" role="status" aria-label="Loading"><span></span></div> }`,
  styles: [`
    :host { position: fixed; z-index: 2000; inset: 0 0 auto; height: 3px; pointer-events: none; }
    .network-loading { height: 3px; overflow: hidden; background: #dce9df; }
    .network-loading span { display: block; width: 35%; height: 100%; background: #198754; animation: loading-slide 1.1s ease-in-out infinite; }
    @keyframes loading-slide { 0% { transform: translateX(-110%); } 100% { transform: translateX(310%); } }
    @media (prefers-reduced-motion: reduce) { .network-loading span { animation: none; width: 100%; } }
  `],
})
export class NetworkLoading {
  readonly network = inject(NetworkStateService);
}
