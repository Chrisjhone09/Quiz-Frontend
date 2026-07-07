import { Injectable, signal } from '@angular/core';
import { ApiResult, QuizCreationModel, QuizResponseModel } from '../interfaces/quizCreation.model';
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
      title: '',
      description: '',
      classroomTitle: '',
      difficulty: 'Mixed',
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
