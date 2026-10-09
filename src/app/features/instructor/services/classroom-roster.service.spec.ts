import { TestBed } from '@angular/core/testing';
import { HttpHeaders, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { Auth } from '../../auth/services/auth';
import { InstructorClassroomService } from './instructor-classroom-service';
import { environment } from '../../../../environments/enviroment.developement';

describe('Classroom roster API', () => {
  let service: InstructorClassroomService;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}/api/instructor-classroom/c1/roster`;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(),
      { provide: Auth, useValue: { getAuthHeaders: () => new HttpHeaders({ Authorization: 'Bearer test-token' }) } },
    ] });
    service = TestBed.inject(InstructorClassroomService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it.each([true, false])('uploads the CSV as authenticated multipart data (preview=%s)', (preview) => {
    const file = new File(['Student ID\n001234'], 'students.csv', { type: 'text/csv' });
    service.importRoster('c1', file, preview).subscribe();
    const request = http.expectOne(`${base}/${preview ? 'preview' : 'import'}`);
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('Authorization')).toBe('Bearer test-token');
    expect(request.request.headers.has('Content-Type')).toBe(false);
    expect(request.request.body).toBeInstanceOf(FormData);
    expect(request.request.body.get('file').name).toBe('students.csv');
    request.flush({ rows: [], imported: !preview });
  });

  it('retrieves reserved IDs with the instructor token', () => {
    service.getPendingRoster('c1').subscribe();
    const request = http.expectOne(base);
    expect(request.request.headers.get('Authorization')).toBe('Bearer test-token');
    request.flush([]);
  });

  it('cancels only the selected reserved ID', () => {
    service.cancelRosterEntry('c1', 'AB-01').subscribe();
    const request = http.expectOne(`${base}/AB-01`);
    expect(request.request.method).toBe('DELETE');
    expect(request.request.headers.get('Authorization')).toBe('Bearer test-token');
    request.flush({ success: true });
  });
});
