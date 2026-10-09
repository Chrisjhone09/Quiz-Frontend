import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { NetworkStateService } from './network-state.service';

describe('NetworkStateService', () => {
  let service: NetworkStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [NetworkStateService] });
    service = TestBed.inject(NetworkStateService);
  });

  it('stays loading until every active request finishes', () => {
    service.start();
    service.start();
    expect(service.loading()).toBe(true);
    service.finish();
    expect(service.loading()).toBe(true);
    service.finish();
    expect(service.loading()).toBe(false);
  });

  it('does not keep a negative request count', () => {
    service.finish();
    service.finish();
    expect(service.loading()).toBe(false);
    service.start();
    service.finish();
    expect(service.loading()).toBe(false);
  });
});
