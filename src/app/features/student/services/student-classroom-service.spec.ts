import { TestBed } from '@angular/core/testing';

import { StudentClassroomService } from './student-classroom-service';

describe('StudentClassroomService', () => {
  let service: StudentClassroomService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StudentClassroomService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
