import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/enviroment.developement';
import { Auth } from '../../auth/services/auth';
import {
  AccountQueue,
  AccountRequest,
  ActivityFeed,
  AdminReport,
  ApiResult,
  ClassroomAdmin,
  CreateInstructorPayload,
  DeletedClassroomAdmin,
  InstructorAdmin,
  StudentAdmin,
  UpdateInstructorPayload,
  UpdateStudentPayload,
  UpdateUserRolesPayload,
  UserRoles,
} from '../interfaces/admin.model';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  constructor(private http: HttpClient, private auth: Auth) {}

  // Every endpoint here is [Authorize(Roles = "Admin")], so the bearer token is
  // mandatory. Once a global HTTP interceptor exists these headers can come out.
  getAccountQueue(): Observable<AccountQueue> {
    return this.http.get<AccountQueue>(`${environment.apiUrl}/api/admin/accounts`, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  approve(userId: string): Observable<ApiResult<AccountRequest>> {
    return this.http.post<ApiResult<AccountRequest>>(
      `${environment.apiUrl}/api/admin/accounts/${userId}/approve`,
      {},
      { headers: this.auth.getAuthHeaders() }
    );
  }

  reject(userId: string, reason: string): Observable<ApiResult<AccountRequest>> {
    return this.http.post<ApiResult<AccountRequest>>(
      `${environment.apiUrl}/api/admin/accounts/${userId}/reject`,
      { reason },
      { headers: this.auth.getAuthHeaders() }
    );
  }

  getReports(): Observable<AdminReport> {
    return this.http.get<AdminReport>(`${environment.apiUrl}/api/admin/reports`, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  getActivity(category: string | null, page = 1, pageSize = 50): Observable<ActivityFeed> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);

    if (category) {
      params = params.set('category', category);
    }

    return this.http.get<ActivityFeed>(`${environment.apiUrl}/api/admin/activity`, {
      headers: this.auth.getAuthHeaders(),
      params,
    });
  }

  // ---- Instructor account creation ----

  createInstructor(payload: CreateInstructorPayload): Observable<ApiResult<InstructorAdmin>> {
    return this.http.post<ApiResult<InstructorAdmin>>(
      `${environment.apiUrl}/api/admin/instructors`,
      payload,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  // ---- Instructor detail management ----

  getInstructors(): Observable<InstructorAdmin[]> {
    return this.http.get<InstructorAdmin[]>(`${environment.apiUrl}/api/admin/instructors`, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  updateInstructor(
    instructorId: string,
    payload: UpdateInstructorPayload
  ): Observable<ApiResult<InstructorAdmin>> {
    return this.http.put<ApiResult<InstructorAdmin>>(
      `${environment.apiUrl}/api/admin/instructors/${instructorId}`,
      payload,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  // ---- Student detail management ----

  getStudents(): Observable<StudentAdmin[]> {
    return this.http.get<StudentAdmin[]>(`${environment.apiUrl}/api/admin/students`, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  updateStudent(studentId: string, payload: UpdateStudentPayload): Observable<ApiResult<StudentAdmin>> {
    return this.http.put<ApiResult<StudentAdmin>>(
      `${environment.apiUrl}/api/admin/students/${studentId}`,
      payload,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  // ---- Account deletion ----

  deleteUser(userId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${environment.apiUrl}/api/admin/users/${userId}`, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  // ---- Role management ----

  updateUserRoles(userId: string, payload: UpdateUserRolesPayload): Observable<ApiResult<UserRoles>> {
    return this.http.put<ApiResult<UserRoles>>(
      `${environment.apiUrl}/api/admin/users/${userId}/roles`,
      payload,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  // ---- Classroom overview ----

  getClassrooms(): Observable<ClassroomAdmin[]> {
    return this.http.get<ClassroomAdmin[]>(`${environment.apiUrl}/api/admin/classrooms`, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  // ---- Deleted classroom recovery ----

  getDeletedClassrooms(): Observable<DeletedClassroomAdmin[]> {
    return this.http.get<DeletedClassroomAdmin[]>(`${environment.apiUrl}/api/admin/classrooms/deleted`, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  restoreClassroom(classroomId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${environment.apiUrl}/api/admin/classrooms/${classroomId}/restore`,
      {},
      { headers: this.auth.getAuthHeaders() }
    );
  }
}
