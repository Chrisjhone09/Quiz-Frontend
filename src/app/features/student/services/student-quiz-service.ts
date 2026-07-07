import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/enviroment.developement';
import {
  ApiResult,
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
}
