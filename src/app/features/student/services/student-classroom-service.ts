import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/enviroment.developement';
import { JoinClassroomDto } from '../interfaces/joinclassroom.model';
import { Auth } from '../../auth/services/auth';
import { StudentModel } from '../../../shared/interfaces/student.model';
import { Announcement } from '../../../shared/interfaces/announcement.model';

@Injectable({
  providedIn: 'root',
})
export class StudentClassroomService {
  constructor(private http: HttpClient, private authService : Auth) { }

  fetchAllClassrooms(): Observable<any> {
    return this.http.get(environment.apiUrl + '/api/student-classroom/get-classrooms/' + this.authService.getUserId(),
      { headers: this.authService.getAuthHeaders() });
  
  }

  joinClassroom(joinClassroomDto: JoinClassroomDto): Observable<any> {
    return this.http.post(environment.apiUrl + '/api/student-classroom/join-classroom', joinClassroomDto);
  }

  getClassroomById(id: string){
    const studentId = this.authService.getUserId();
    const params = studentId ? new HttpParams().set('studentId', studentId) : undefined;

    return this.http.get(environment.apiUrl + '/api/student-classroom/get-classroom/' + id, { params });
  }

  leaveClassroom(classroomId : string) {
    return this.http.delete(environment.apiUrl + '/api/student-classroom/leave-classroom', {
      body: {
        userId : this.authService.getUserId(),
        classroomId
      }
    })
  }

  // ---- Classmates ----
  // [Authorize(Roles = "Student")], so the auth header is required.

  getClassmates(classroomId: string): Observable<StudentModel[]> {
    const studentId = this.authService.getUserId();
    const params = studentId ? new HttpParams().set('studentId', studentId) : undefined;

    return this.http.get<StudentModel[]>(
      environment.apiUrl + '/api/student-classroom/' + classroomId + '/classmates',
      { params, headers: this.authService.getAuthHeaders() }
    );
  }

  // ---- Announcements ----

  getAnnouncements(classroomId: string): Observable<Announcement[]> {
    const studentId = this.authService.getUserId();
    const params = studentId ? new HttpParams().set('studentId', studentId) : undefined;

    return this.http.get<Announcement[]>(
      environment.apiUrl + '/api/student-classroom/' + classroomId + '/announcements',
      { params, headers: this.authService.getAuthHeaders() }
    );
  }

  acknowledgeAnnouncement(announcementId: string): Observable<Announcement> {
    const studentId = this.authService.getUserId();
    const params = studentId ? new HttpParams().set('studentId', studentId) : undefined;

    return this.http.post<Announcement>(
      environment.apiUrl + '/api/student-classroom/announcements/' + announcementId + '/acknowledge',
      {},
      { params, headers: this.authService.getAuthHeaders() }
    );
  }
}
