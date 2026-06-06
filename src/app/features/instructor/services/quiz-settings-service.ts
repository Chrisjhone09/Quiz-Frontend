import { Injectable, signal } from '@angular/core';
import { QuizCreationModel } from '../interfaces/quizCreation.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/enviroment.developement';

@Injectable({
  providedIn: 'root',
})
export class QuizSettingsService {


  constructor (private http : HttpClient){}
  readonly quizSettings = signal<QuizCreationModel | null>(null);

  setQuizSettings(quizSettings : QuizCreationModel) {
    this.quizSettings.set(quizSettings);
  }

  uploadFiles(formData :FormData) {
    return this.http.post(environment.apiUrl+"/api/classroom/upload-file", formData)
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
