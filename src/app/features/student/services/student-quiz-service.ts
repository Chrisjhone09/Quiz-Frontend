import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/enviroment.developement';
import {
  ApiResult,
  QuizResult,
  QuizSubmission,
  QuizSubmissionResult,
  StudentQuiz,
} from '../interfaces/student-quiz.model';
import { Auth } from '../../auth/services/auth';

@Injectable({
  providedIn: 'root',
})
export class StudentQuizService {
  constructor(private http: HttpClient, private auth: Auth) {}

  getQuiz(quizId: number): Observable<ApiResult<StudentQuiz>> {
    const studentId = this.auth.getUserId();
    const params = studentId ? new HttpParams().set('studentId', studentId) : undefined;

    return this.http.get<ApiResult<StudentQuiz>>(
      `${environment.apiUrl}/api/classroom/take/${quizId}`,
      { params }
    );
  }

  submitQuiz(payload: QuizSubmission): Observable<ApiResult<QuizSubmissionResult>> {
    return this.http.post<ApiResult<QuizSubmissionResult>>(
      `${environment.apiUrl}/api/classroom/submit`,
      payload
    );
  }

  /** Per-question breakdown of a submitted attempt. 400s if results aren't released. */
  getResult(quizId: number): Observable<ApiResult<QuizResult>> {
    const params = new HttpParams().set('studentId', this.auth.getUserId());

    return this.http.get<ApiResult<QuizResult>>(
      `${environment.apiUrl}/api/classroom/result/${quizId}`,
      { params }
    );
  }

  recordTabSwitch(studentId: string, quizId: number): Observable<ApiResult<unknown>> {
    return this.http.post<ApiResult<unknown>>(
      `${environment.apiUrl}/api/classroom/monitoring/tab-switch`,
      {
        studentId,
        quizId,
        action: 'Tab switched',
      }
    );
  }
}
