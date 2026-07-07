import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { SourceMaterial } from '../quiz-generator.models';
import { QuizSettings } from '../quiz-settings/quiz-settings';
import { QuizCreationModel, QuizQuestionModel, QuizResponseModel } from '../../../interfaces/quizCreation.model';
import { QuizSettingsService } from '../../../services/quiz-settings-service';

@Component({
  selector: 'app-review-edit-step',
  imports: [QuizSettings],
  templateUrl: './review-edit-step.html',
  styleUrl: './review-edit-step.css',
})
export class ReviewEditStep {
  private readonly router = inject(Router);
  private readonly quizSettingsService = inject(QuizSettingsService);

  readonly quizSettingsComponent = viewChild(QuizSettings);

  readonly quiz = signal<QuizResponseModel | null>(this.quizSettingsService.generatedQuiz());
  readonly questions = computed(() => this.quiz()?.questions ?? []);

  readonly sourceMaterials = signal<SourceMaterial[]>([
    { id: 1, name: 'CS101_Syllabus.pdf', status: 'Processed' },
    { id: 2, name: 'Week4_Trees_Slides.pdf', status: 'Processed' },
  ]);

  readonly questionCount = computed(() => this.questions().length);

  addQuestion(): void {
    this.updateQuestions((questions) => [
      ...questions,
      {
        id: 0,
        text: 'New question',
        points: 1,
        questionType: 'short_answer',
        correctAnswer: '',
        correctChoiceId: null,
        choices: [],
      },
    ]);
  }

  updateQuestionText(question: QuizQuestionModel, event: Event): void {
    const text = (event.target as HTMLTextAreaElement).value;
    this.updateQuestion(question, { text });
  }

  updateQuestionAnswer(question: QuizQuestionModel, event: Event): void {
    const correctAnswer = (event.target as HTMLInputElement).value;
    this.updateQuestion(question, { correctAnswer });
  }

  updateChoiceText(question: QuizQuestionModel, choiceId: number, event: Event): void {
    const text = (event.target as HTMLInputElement).value;
    this.updateQuestion(question, {
      choices: question.choices.map((choice) =>
        choice.id === choiceId ? { ...choice, text } : choice
      ),
    });
  }

  markCorrectChoice(question: QuizQuestionModel, choiceId: number): void {
    this.updateQuestion(question, { correctChoiceId: choiceId });
  }

  deleteQuestion(question: QuizQuestionModel): void {
    this.updateQuestions((questions) => questions.filter((item) => item !== question));
  }

  duplicateQuestion(question: QuizQuestionModel): void {
    this.updateQuestions((questions) => [
      ...questions,
      {
        ...question,
        id: 0,
        choices: question.choices.map((choice) => ({ ...choice, id: 0 })),
      },
    ]);
  }

  saveDraft(): void {
    const settings = this.updateQuizSettings();
    const quiz = this.quiz();

    if (!quiz || !settings) {
      return;
    }

    this.quizSettingsService.saveDraft(quiz.id, quiz, settings).subscribe({
      next: (result) => {
        if (result.success && result.data) {
          this.quiz.set(result.data);
          this.quizSettingsService.setGeneratedQuiz(result.data);
        }
      },
      error: (error) => console.error('Draft save failed', error),
    });
  }

  publishQuiz(): void {
    this.router.navigate(['/quiz-generator/publish']);
  }

  onQuizSettingsSubmitted(settings: QuizCreationModel): void {
    this.quizSettingsService.updateSettings(settings);
  }

  private updateQuizSettings(): QuizCreationModel | null {
    const settings = this.quizSettingsComponent()?.submitSettings();

    if (!settings) {
      return null;
    }

    this.quizSettingsService.updateSettings(settings);
    return settings;
  }

  private updateQuestion(question: QuizQuestionModel, updates: Partial<QuizQuestionModel>): void {
    this.updateQuestions((questions) =>
      questions.map((item) => (item === question ? { ...item, ...updates } : item))
    );
  }

  private updateQuestions(project: (questions: QuizQuestionModel[]) => QuizQuestionModel[]): void {
    const quiz = this.quiz();

    if (!quiz) {
      return;
    }

    const updatedQuiz = {
      ...quiz,
      questions: project(quiz.questions),
    };

    this.quiz.set(updatedQuiz);
    this.quizSettingsService.setGeneratedQuiz(updatedQuiz);
  }
}
