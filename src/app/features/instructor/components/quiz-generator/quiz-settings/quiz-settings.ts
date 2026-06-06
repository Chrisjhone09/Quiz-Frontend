import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { ClassroomModel } from '../../../../../shared/interfaces/classrooms.model';
import { InstructorClassroomService } from '../../../services/instructor-classroom-service';
import { QuizCreationModel } from '../../../interfaces/quizCreation.model';
import { QuizSettingsService } from '../../../services/quiz-settings-service';
import { form, FormField, FormRoot } from '@angular/forms/signals';

type QuizSettingsMode = 'upload' | 'review';

@Component({
  selector: 'app-quiz-settings',
  imports: [FormRoot, FormField],
  templateUrl: './quiz-settings.html',
  styleUrl: './quiz-settings.css',
})
export class QuizSettings implements OnInit {
 
  readonly mode = input<QuizSettingsMode>('upload');
  readonly quizTitle = input('');
  readonly classroom = input('');
  readonly settingsSubmitted = output<QuizCreationModel>();

  readonly questionTypeOptions = ['Multiple Choice', 'True/False', 'Short Answer'];
  classrooms = signal<ClassroomModel[]>([])

  instructorService = inject(InstructorClassroomService)
  quizService = inject(QuizSettingsService)


  ngOnInit(): void {
    this.hydrateModel();

    this.instructorService.getClassrooms().subscribe({
      next: (response : ClassroomModel[]) => {
        this.classrooms.set(response)
      }
    })
  }


  quizSettingsModel = signal<QuizCreationModel>(this.quizService.createDefaultSettings())




  quizSettingsForm = form(this.quizSettingsModel, {
    submission: {
      action: async () => {
        this.submitSettings();
      }
    }
  })

  submitSettings(): QuizCreationModel {
    const model = { ...this.quizSettingsModel() };
    this.publishSettings(model);

    return model;
  }

  isQuestionTypeSelected(type: string): boolean {
    return this.quizSettingsModel().types.includes(type);
  }

  updateQuestionTypes(type: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;

    this.quizSettingsModel.update((settings) => {
      const nextTypes = checked
        ? Array.from(new Set([...settings.types.filter((item) => item !== 'Mixed'), type]))
        : settings.types.filter((item) => item !== type);

      return {
        ...settings,
        questionType: nextTypes.length === 1 ? nextTypes[0] : 'Mixed',
        types: nextTypes.length ? nextTypes : ['Mixed'],
      };
    });
  }

  private publishSettings(model: QuizCreationModel): void {
    this.quizService.updateSettings(model);
    this.settingsSubmitted.emit(model);
  }

  private hydrateModel(): void {
    const existingSettings = this.quizService.quizSettings();

    this.quizSettingsModel.update((settings) => ({
      ...settings,
      ...existingSettings,
      title: existingSettings?.title || this.quizTitle() || settings.title,
      classroomTitle: existingSettings?.classroomTitle || this.classroom() || settings.classroomTitle,
      questionType: existingSettings?.questionType || existingSettings?.types?.[0] || settings.questionType,
      types: existingSettings?.types?.length ? existingSettings.types : settings.types,
    }));
  }

  
}
