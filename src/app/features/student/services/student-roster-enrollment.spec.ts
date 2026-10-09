import { TestBed } from '@angular/core/testing';
import { HttpHeaders, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, expect, it } from 'vitest';
import { Auth } from '../../auth/services/auth';
import { StudentClassroomService } from './student-classroom-service';
import { environment } from '../../../../environments/enviroment.developement';

describe('Automatic roster enrollment dashboard request', () => {
  it('uses the signed-in student profile and bearer token', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(),
      { provide: Auth, useValue: { getUserId: () => 'student-profile-id', getAuthHeaders: () => new HttpHeaders({ Authorization: 'Bearer student-token' }) } },
    ] });
    TestBed.inject(StudentClassroomService).fetchAllClassrooms().subscribe();
    const http = TestBed.inject(HttpTestingController);
    const request = http.expectOne(`${environment.apiUrl}/api/student-classroom/get-classrooms/student-profile-id`);
    expect(request.request.headers.get('Authorization')).toBe('Bearer student-token');
    request.flush([]);
    http.verify();
  });
});
