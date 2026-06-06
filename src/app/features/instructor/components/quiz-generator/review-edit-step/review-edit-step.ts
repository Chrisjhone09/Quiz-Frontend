import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { QuizQuestion, SourceMaterial } from '../quiz-generator.models';
import { QuizSettings } from '../quiz-settings/quiz-settings';
import { QuizCreationModel } from '../../../interfaces/quizCreation.model';
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

  readonly questions = signal<QuizQuestion[]>([
    {
      id: 4,
      type: 'Multiple Choice',
      text: 'What is the maximum number of nodes at level L in a binary tree? (Root is level 0)',
      options: [
        { id: 'A', label: '2^L', correct: true },
        { id: 'B', label: '2^(L-1)', correct: false },
        { id: 'C', label: '2^L - 1', correct: false },
        { id: 'D', label: 'L^2', correct: false },
      ],
    },
    {
      id: 5,
      type: 'True/False',
      text: 'In a balanced binary search tree, the height difference between left and right subtrees is at most 1 for every node.',
      options: [
        { id: 'A', label: 'True', correct: true },
        { id: 'B', label: 'False', correct: false },
      ],
    },
  ]);

  readonly sourceMaterials = signal<SourceMaterial[]>([
    { id: 1, name: 'CS101_Syllabus.pdf', status: 'Processed' },
    { id: 2, name: 'Week4_Trees_Slides.pdf', status: 'Processed' },
  ]);

  readonly questionCount = computed(() => this.questions().length);

  addQuestion(): void {
    // TODO: Implement manual question creation
  }

  editQuestion(): void {
    // TODO: Implement question editing
  }

  deleteQuestion(): void {
    // TODO: Implement question deletion
  }

  duplicateQuestion(): void {
    // TODO: Implement question duplication
  }

  saveDraft(): void {
    this.updateQuizSettings();
    // TODO: Implement draft saving
  }

  publishQuiz(): void {
    this.updateQuizSettings();
    this.router.navigate(['/quiz-generator/publish']);
    // TODO: Implement quiz publishing
  }

  onQuizSettingsSubmitted(settings: QuizCreationModel): void {
    this.quizSettingsService.updateSettings(settings);
  }

  private updateQuizSettings(): void {
    const settings = this.quizSettingsComponent()?.submitSettings();

    if (!settings) {
      return;
    }

    this.quizSettingsService.updateSettings(settings);
  }
}
