import { HttpClient, HttpHeaders, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { cacheLoadingInterceptor } from './cache-loading.interceptor';
import { NetworkStateService } from '../services/network-state.service';

describe('cacheLoadingInterceptor', () => {
  let http: HttpTestingController;
  let network: NetworkStateService;
  let client: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(withInterceptors([cacheLoadingInterceptor])),
      provideHttpClientTesting(),
    ] });
    http = TestBed.inject(HttpTestingController);
    network = TestBed.inject(NetworkStateService);
    client = TestBed.inject(HttpClient);
  });

  afterEach(() => http.verify());

  it('caches successful GET responses for the same authenticated request', () => {
    const headers = new HttpHeaders({ Authorization: 'Bearer student-token' });
    let first: unknown;
    let second: unknown;
    client.get('/api/classrooms', { headers }).subscribe(value => first = value);
    expect(network.loading()).toBe(true);
    const request = http.expectOne('/api/classrooms');
    request.flush({ id: 1, title: 'Cached classroom' });
    expect(first).toEqual({ id: 1, title: 'Cached classroom' });
    expect(network.loading()).toBe(false);

    client.get('/api/classrooms', { headers }).subscribe(value => second = value);
    http.expectNone('/api/classrooms');
    expect(second).toEqual(first);
  });

  it('invalidates cached GET data after a successful write', () => {
    client.get('/api/classrooms').subscribe();
    http.expectOne('/api/classrooms').flush([{ id: 1 }]);
    client.post('/api/classrooms', { title: 'Changed' }).subscribe();
    http.expectOne('/api/classrooms').flush({ id: 2 });
    client.get('/api/classrooms').subscribe();
    http.expectOne('/api/classrooms').flush([{ id: 1 }, { id: 2 }]);
    expect(network.loading()).toBe(false);
  });
});
