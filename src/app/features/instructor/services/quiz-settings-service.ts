import { Injectable, signal } from '@angular/core';
import { ApiResult, QuizCreationModel, QuizQuestionModel, QuizResponseModel } from '../interfaces/quizCreation.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/enviroment.developement';

@Injectable({
  providedIn: 'root',
})
export class QuizSettingsService {


  constructor (private http : HttpClient){}
  readonly quizSettings = signal<QuizCreationModel | null>(null);
  readonly generatedQuiz = signal<QuizResponseModel | null>(null);

  setQuizSettings(quizSettings : QuizCreationModel) {
    this.quizSettings.set(quizSettings);
  }

  generateQuiz(formData :FormData) {
    return this.http.post<ApiResult<QuizResponseModel>>(environment.apiUrl+"/api/classroom/generate-quiz", formData)
  }

  /** Manual quiz creation — instructor-authored questions, no file upload or AI generation.
   * Saved as a draft unless publish is true, in which case the backend also applies a
   * schedule (falling back to "open now, due in a week" if quizSettings didn't set one). */
  createManualQuiz(quizSettings: QuizCreationModel, questions: QuizQuestionModel[], publish: boolean) {
    return this.http.post<ApiResult<QuizResponseModel>>(
      environment.apiUrl + "/api/classroom/create-manual-quiz?publish=" + publish,
      { quizSettings, questions }
    );
  }

  saveDraft(quizId: number, quiz: QuizResponseModel, quizSettings: QuizCreationModel) {
    return this.http.put<ApiResult<QuizResponseModel>>(
      environment.apiUrl + "/api/classroom/save-draft/" + quizId,
      { quizSettings, questions: quiz.questions }
    );
  }

  publishQuiz(quizId: number, quiz: QuizResponseModel, quizSettings: QuizCreationModel) {
    return this.http.put<ApiResult<QuizResponseModel>>(
      environment.apiUrl + "/api/classroom/publish-quiz/" + quizId,
      { quizSettings, questions: quiz.questions }
    );
  }

  /** Fetches an existing quiz — AI-generated or manually created — for editing. */
  getQuiz(quizId: number) {
    return this.http.get<ApiResult<QuizResponseModel>>(
      environment.apiUrl + "/api/classroom/get-quiz/" + quizId
    );
  }

  /** Same request shape as createManualQuiz, but against an existing quiz id — used by the
   * standalone quiz editor to save changes without publishing (works for AI-generated quizzes
   * too, since save-draft/publish-quiz just replace the question set either way). */
  saveDraftQuestions(quizId: number, quizSettings: QuizCreationModel, questions: QuizQuestionModel[]) {
    return this.http.put<ApiResult<QuizResponseModel>>(
      environment.apiUrl + "/api/classroom/save-draft/" + quizId,
      { quizSettings, questions }
    );
  }

  publishQuizQuestions(quizId: number, quizSettings: QuizCreationModel, questions: QuizQuestionModel[]) {
    return this.http.put<ApiResult<QuizResponseModel>>(
      environment.apiUrl + "/api/classroom/publish-quiz/" + quizId,
      { quizSettings, questions }
    );
  }

  setGeneratedQuiz(quiz: QuizResponseModel | null) {
    this.generatedQuiz.set(quiz);
  }

  setSettings(quizSettings : QuizCreationModel | null){
    this.quizSettings.set(quizSettings);
  }

  updateSettings(quizSettings : Partial<QuizCreationModel> | null){
    if (!quizSettings) {
      return;
    }

    this.quizSettings.update((current) => ({
      ...this.createDefaultSettings(),
      ...current,
      ...quizSettings,
    }));
  }

  createDefaultSettings(): QuizCreationModel {
    return {
      title: 'Untitled Quiz',
      description: '',
      classroomTitle: '',
      classroomId: '',
      difficulty: 'Hard',
      questionType: 'Mixed',
      types: ['Mixed'],
      validUntil: '',
      openAt: '',
      openDate: '',
      openTime: '',
      closeDate: '',
      closeTime: '',
      expiresAt: '',
      scheduleEnabled: true,
      scheduledOpeningEnabled: false,
      notifyStudents: true,
      autoReleaseScore: true,
      numberOfQuestions: 15,
      timeLimit: 60,
      passingScore: 80,
    };
  }

}
