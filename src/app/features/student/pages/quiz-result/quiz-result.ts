import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { StudentQuizService } from '../../services/student-quiz-service';
import { QuizResult, QuizResultQuestion } from '../../interfaces/student-quiz.model';
import { TimeAgoPipe } from '../../../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-quiz-result',
  imports: [CommonModule, RouterLink, TimeAgoPipe],
  templateUrl: './quiz-result.html',
  styleUrl: './quiz-result.css',
})
export class QuizResultPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly quizService = inject(StudentQuizService);

  readonly result = signal<QuizResult | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal('');

  readonly incorrectCount = computed(() => {
    const result = this.result();
    return result ? result.totalQuestions - result.correctCount : 0;
  });

  ngOnInit(): void {
    const quizId = Number(this.route.snapshot.paramMap.get('quizId'));

    if (!quizId) {
      this.loading.set(false);
      this.errorMessage.set('Quiz not found.');
      return;
    }

    this.quizService.getResult(quizId).subscribe({
      next: (response) => {
        this.result.set(response.data);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        // The API's message is the useful part here — most often "your instructor
        // has not released the results for this quiz yet".
        this.errorMessage.set(
          error?.error?.message?.trim()
            ? error.error.message
            : 'Unable to load this result.'
        );
      },
    });
  }

  questionTypeLabel(questionType: string): string {
    return questionType.replace('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  /** The text of whichever choice the student picked. */
  yourChoiceText(question: QuizResultQuestion): string {
    const choice = question.choices.find((c) => c.id === question.yourChoiceId);
    return choice?.text ?? 'No answer';
  }

  correctChoiceText(question: QuizResultQuestion): string {
    const choice = question.choices.find((c) => c.id === question.correctChoiceId);
    return choice?.text ?? '—';
  }

  displayedAnswer(question: QuizResultQuestion): string {
    if (question.questionType === 'multiple_choice') {
      return this.yourChoiceText(question);
    }

    return question.yourAnswer?.trim() ? question.yourAnswer : 'No answer';
  }

  displayedCorrectAnswer(question: QuizResultQuestion): string {
    if (question.questionType === 'multiple_choice') {
      return this.correctChoiceText(question);
    }

    return question.correctAnswer?.trim() ? question.correctAnswer : '—';
  }
}
