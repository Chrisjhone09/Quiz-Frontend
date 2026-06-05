import { TestBed } from '@angular/core/testing';

import { InstructorClassroomService } from './instructor-classroom-service';

describe('InstructorClassroomService', () => {
  let service: InstructorClassroomService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InstructorClassroomService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
