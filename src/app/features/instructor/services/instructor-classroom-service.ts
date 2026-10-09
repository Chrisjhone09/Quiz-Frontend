import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Auth } from '../../auth/services/auth';
import { environment } from '../../../../environments/enviroment.developement';
import { Header } from '../../../shared/header/header';
import { ClassroomModel } from '../../../shared/interfaces/classrooms.model';
import { ClassroomCreationModel } from '../../../shared/interfaces/classroomCreation.model';
import { StudentModel } from '../../../shared/interfaces/student.model';
import { QuizModel } from '../../student/interfaces/quiz.model';
import { MonitoringActionPayload, MonitoringDashboard } from '../interfaces/monitoring.model';
import { EnrollmentDecisionPayload, EnrollmentQueue } from '../interfaces/enrollment.model';
import { Announcement, CreateAnnouncementPayload } from '../../../shared/interfaces/announcement.model';
import { QuizLeaderboard } from '../interfaces/quiz-leaderboard.model';
import { ClassroomRosterImport, PendingRosterEntry } from '../interfaces/classroom-roster.model';


@Injectable({
  providedIn: 'root',
})
export class InstructorClassroomService {

 baseHeaders = new HttpHeaders();

  constructor(private http: HttpClient, private authService : Auth){}

  getClassrooms(){
    return this.http.get<ClassroomModel[]>(environment.apiUrl+"/api/instructor-classroom/get-classroom", {
      headers: this.authService.getAuthHeaders()
    })
  }

  // ---- Danger zone (Settings tab) ----
  // All three are owner-only server-side, so the auth header is required.

  /** Permanently (soft-)deletes the classroom. */
  deleteClassroom(classroomId: string | null | undefined) {
    return this.http.delete(
      environment.apiUrl + "/api/instructor-classroom/" + classroomId,
      { headers: this.authService.getAuthHeaders() }
    );
  }

  /** Hides the classroom from this instructor's own dashboard without touching its data. */
  archiveClassroom(classroomId: string | null | undefined) {
    return this.http.post(
      environment.apiUrl + "/api/instructor-classroom/" + classroomId + "/archive",
      {},
      { headers: this.authService.getAuthHeaders() }
    );
  }

  /** Undoes archiveClassroom, restoring the classroom to the dashboard. */
  unarchiveClassroom(classroomId: string | null | undefined) {
    return this.http.post(
      environment.apiUrl + "/api/instructor-classroom/" + classroomId + "/unarchive",
      {},
      { headers: this.authService.getAuthHeaders() }
    );
  }

  updateClassroom(classroomId: string, model: ClassroomCreationModel) {
    return this.http.put<ClassroomModel>(
      environment.apiUrl + "/api/instructor-classroom/" + classroomId,
      model,
      { headers: this.authService.getAuthHeaders() }
    )
  }

  createClassrooom(model : ClassroomCreationModel) {
    return this.http.post<ClassroomModel>(environment.apiUrl+"/api/instructor-classroom/create-classroom", model, {
      headers: this.authService.getAuthHeaders()
    })
  }

  getClassroom(classroomId: string){
    return this.http.get<ClassroomModel>(environment.apiUrl+ "/api/instructor-classroom/classroom/"+classroomId)
  }

  getStudentList(classroomId : string | null | undefined){
    return this.http.get<StudentModel[]>(environment.apiUrl+"/api/instructor-classroom/"+classroomId+"/students-list")
  }

  importRoster(classroomId: string, file: File, preview: boolean) {
    const body = new FormData();
    body.append('file', file, file.name);
    return this.http.post<ClassroomRosterImport>(
      `${environment.apiUrl}/api/instructor-classroom/${classroomId}/roster/${preview ? 'preview' : 'import'}`,
      body, { headers: this.authService.getAuthHeaders() }
    );
  }

  getPendingRoster(classroomId: string) {
    return this.http.get<PendingRosterEntry[]>(`${environment.apiUrl}/api/instructor-classroom/${classroomId}/roster`,
      { headers: this.authService.getAuthHeaders() });
  }

  cancelRosterEntry(classroomId: string, studentNumber: string) {
    return this.http.delete(`${environment.apiUrl}/api/instructor-classroom/${classroomId}/roster/${encodeURIComponent(studentNumber)}`,
      { headers: this.authService.getAuthHeaders() });
  }

  removeStudent(classroomId: string | null | undefined, studentId: string) {
    return this.http.delete(
      environment.apiUrl + "/api/instructor-classroom/" + classroomId + "/students/" + studentId,
      { headers: this.authService.getAuthHeaders() }
    );
  }

  getQuizzes(classroomId:string | null | undefined){
    return this.http.get<QuizModel[]>(environment.apiUrl+"/api/instructor-classroom/"+classroomId+"/quizzes");
  }

  getMonitoring(classroomId: string | null | undefined, quizId?: number | null) {
    const query = quizId ? `?quizId=${quizId}` : '';
    return this.http.get<MonitoringDashboard>(
      environment.apiUrl + "/api/instructor-classroom/" + classroomId + "/monitoring" + query
    );
  }

  warnStudent(payload: MonitoringActionPayload) {
    return this.http.post(
      environment.apiUrl + "/api/instructor-classroom/monitoring/warn",
      payload
    );
  }

  forceSubmit(payload: MonitoringActionPayload) {
    return this.http.post(
      environment.apiUrl + "/api/instructor-classroom/monitoring/force-submit",
      payload
    );
  }

  // ---- Enrolment approval (spec flow 3) ----
  // These endpoints are [Authorize(Roles = "Instructor")] and derive the deciding
  // instructor from the token, so the auth header is required.

  getEnrollmentRequests(classroomId: string | null | undefined) {
    return this.http.get<EnrollmentQueue>(
      environment.apiUrl + "/api/instructor-classroom/" + classroomId + "/enrollment-requests",
      { headers: this.authService.getAuthHeaders() }
    );
  }

  approveEnrollment(payload: EnrollmentDecisionPayload) {
    return this.http.post(
      environment.apiUrl + "/api/instructor-classroom/enrollment/approve",
      payload,
      { headers: this.authService.getAuthHeaders() }
    );
  }

  rejectEnrollment(payload: EnrollmentDecisionPayload) {
    return this.http.post(
      environment.apiUrl + "/api/instructor-classroom/enrollment/reject",
      payload,
      { headers: this.authService.getAuthHeaders() }
    );
  }

  // ---- Announcements ----

  getAnnouncements(classroomId: string | null | undefined) {
    return this.http.get<Announcement[]>(
      environment.apiUrl + "/api/instructor-classroom/" + classroomId + "/announcements",
      { headers: this.authService.getAuthHeaders() }
    );
  }

  postAnnouncement(classroomId: string | null | undefined, payload: CreateAnnouncementPayload) {
    return this.http.post<Announcement>(
      environment.apiUrl + "/api/instructor-classroom/" + classroomId + "/announcements",
      payload,
      { headers: this.authService.getAuthHeaders() }
    );
  }

  // ---- Results ----
  // [Authorize(Roles = "Instructor")] and derives the caller from the token, so the
  // auth header is required — a student hitting this by quiz id would otherwise see
  // every classmate's score.

  getQuizLeaderboard(quizId: number) {
    return this.http.get<QuizLeaderboard>(
      environment.apiUrl + "/api/classroom/quiz/" + quizId + "/leaderboard",
      { headers: this.authService.getAuthHeaders() }
    );
  }

}
