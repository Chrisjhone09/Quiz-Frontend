import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { ClassroomModel } from '../../../../../shared/interfaces/classrooms.model';
import { InstructorClassroomService } from '../../../services/instructor-classroom-service';
import { QuestionTypeAllocation, QuizCreationModel } from '../../../interfaces/quizCreation.model';
import { allocationError, defaultQuestionAllocations, QUESTION_TYPES, QuestionTypeSettings } from '../../question-type-settings/question-type-settings';
import { QuizSettingsService } from '../../../services/quiz-settings-service';
import { form, FormField, FormRoot } from '@angular/forms/signals';

type QuizSettingsMode = 'upload' | 'review';

@Component({
  selector: 'app-quiz-settings',
  imports: [FormRoot, FormField, QuestionTypeSettings],
  templateUrl: './quiz-settings.html',
  styleUrl: './quiz-settings.css',
})
export class QuizSettings implements OnInit {
 
  readonly mode = input<QuizSettingsMode>('upload');
  readonly quizTitle = input('');
  readonly classroom = input('');
  readonly settingsSubmitted = output<QuizCreationModel>();

  readonly allocations = signal<QuestionTypeAllocation[]>(defaultQuestionAllocations());
  readonly allocationError = signal('');
  classrooms = signal<ClassroomModel[]>([])

  instructorService = inject(InstructorClassroomService)
  quizService = inject(QuizSettingsService)


  ngOnInit(): void {
    this.hydrateModel();

    this.instructorService.getClassrooms().subscribe({
      next: (response : ClassroomModel[]) => {
        this.classrooms.set(response);
        if (this.mode() === 'upload' && !response.some((item) => item.id === this.quizSettingsModel().classroomId)) {
          this.quizSettingsModel.update((settings) => ({ ...settings, classroomId: response[0]?.id ?? '' }));
        }
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

  submitSettings(): QuizCreationModel | undefined {
    const model = { ...this.quizSettingsModel() };
    model.difficulty = 'Hard';
    if (this.mode() === 'upload') {
      const error = allocationError(this.allocations());
      this.allocationError.set(error);
      if (error) return undefined;
      model.types = this.allocations().map(({ type }) => type);
      model.questionType = model.types.length === 1 ? model.types[0] : 'Mixed';
      model.questionTypeCounts = Object.fromEntries(this.allocations().map(({ type, count }) => [type, count!]));
      model.numberOfQuestions = this.allocations().reduce((sum, { count }) => sum + count!, 0);
    }
    this.publishSettings(model);

    return model;
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
      difficulty: 'Hard',
      title: existingSettings?.title || this.quizTitle() || settings.title,
      classroomTitle: existingSettings?.classroomTitle || this.classroom() || settings.classroomTitle,
      questionType: existingSettings?.questionType || existingSettings?.types?.[0] || settings.questionType,
      types: existingSettings?.types?.length ? existingSettings.types : settings.types,
    }));

    const settings = this.quizSettingsModel();
    if (settings.questionTypeCounts) {
      this.allocations.set(QUESTION_TYPES.filter(({ value }) => settings.questionTypeCounts![value] != null)
        .map(({ value }) => ({ type: value, count: settings.questionTypeCounts![value]! })));
    } else {
      const selected = QUESTION_TYPES.filter(({ value, label }) => settings.types.includes(value)
        || settings.types.includes(label) || (value === 'true_false' && settings.types.includes('True/False')));
      const options = selected.length ? selected : QUESTION_TYPES;
      this.allocations.set(options.map(({ value }, index) => ({
        type: value,
        count: Math.floor(settings.numberOfQuestions / options.length)
          + (index < settings.numberOfQuestions % options.length ? 1 : 0),
      })));
    }
  }

  
}
