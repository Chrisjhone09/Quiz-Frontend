import { HttpEvent, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, defer, finalize, shareReplay, tap, throwError } from 'rxjs';
import { HttpCacheService } from '../services/http-cache.service';
import { NetworkStateService } from '../services/network-state.service';

export const cacheLoadingInterceptor: HttpInterceptorFn = (request, next) => {
  const cache = inject(HttpCacheService);
  const network = inject(NetworkStateService);

  const isDynamicEndpoint = /\/monitoring(?:\/|\?|$)|\/leaderboard(?:\/|\?|$)|\/activity(?:\/|\?|$)|\/reports(?:\/|\?|$)/i.test(request.urlWithParams);

  if (request.method === 'GET' && !isDynamicEndpoint) {
    const cached = cache.get(request);
    if (cached) return cached;

    let response$: Observable<HttpEvent<unknown>>;
    response$ = defer(() => next(request)).pipe(
      tap((event: HttpEvent<unknown>) => {
        if (event instanceof HttpResponse && event.ok) {
          cache.set(request, response$);
        }
      }),
      catchError((error) => {
        cache.remove(request);
        return throwError(() => error);
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    network.start();
    return response$.pipe(finalize(() => network.finish()));
  }

  if (request.method === 'GET') {
    network.start();
    return next(request).pipe(finalize(() => network.finish()));
  }

  network.start();
  return next(request).pipe(
    tap((event) => {
      if (event instanceof HttpResponse && event.ok) cache.clear();
    }),
    finalize(() => network.finish()),
  );
};
