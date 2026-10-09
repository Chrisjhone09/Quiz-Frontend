import { Injectable } from '@angular/core';
import { HttpEvent, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

interface CacheEntry {
  response$: Observable<HttpEvent<unknown>>;
  createdAt: number;
}

/** Session cache for successful GET responses. Writes invalidate the whole cache
 * because a classroom mutation can affect several dashboard endpoints at once. */
@Injectable({ providedIn: 'root' })
export class HttpCacheService {
  private readonly entries = new Map<string, CacheEntry>();
  private readonly maxAgeMs = 5 * 60 * 1000;

  key(request: HttpRequest<unknown>): string {
    return `${request.method}:${request.urlWithParams}:${request.headers.get('Authorization') ?? 'public'}`;
  }

  get(request: HttpRequest<unknown>): Observable<HttpEvent<unknown>> | null {
    const entry = this.entries.get(this.key(request));
    if (!entry) return null;
    if (Date.now() - entry.createdAt > this.maxAgeMs) {
      this.entries.delete(this.key(request));
      return null;
    }
    return entry.response$;
  }

  set(request: HttpRequest<unknown>, response$: Observable<HttpEvent<unknown>>): void {
    this.entries.set(this.key(request), { response$, createdAt: Date.now() });
  }

  remove(request: HttpRequest<unknown>): void {
    this.entries.delete(this.key(request));
  }

  clear(): void {
    this.entries.clear();
  }
}
