import { TestBed } from '@angular/core/testing';

import { AiProcessSignalRService } from './ai-process-signal-rservice';

describe('AiProcessSignalRService', () => {
  let service: AiProcessSignalRService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AiProcessSignalRService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
