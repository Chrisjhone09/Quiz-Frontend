import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Auth } from '../../../auth/services/auth';
import { StudentQuizService } from '../../services/student-quiz-service';
import { QuizMonitoringRealtimeService } from '../../../../shared/services/quiz-monitoring-realtime.service';
import {
  QuizSubmissionResult,
  StudentQuiz,
  StudentQuizAnswer,
  StudentQuizQuestion,
} from '../../interfaces/student-quiz.model';

interface AnswerDraft {
  answer?: string | null;
  choiceId?: number | null;
}

@Component({
  selector: 'app-take-quiz',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './take-quiz.html',
  styleUrl: './take-quiz.css',
})
export class TakeQuiz implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly quizService = inject(StudentQuizService);
  private readonly auth = inject(Auth);
  private readonly realtime = inject(QuizMonitoringRealtimeService);
  private timerId: number | null = null;
  private warningSubscription?: Subscription;
  private forceSubmitSubscription?: Subscription;

  readonly quiz = signal<StudentQuiz | null>(null);
  readonly currentIndex = signal(0);
  readonly answers = signal<Record<number, AnswerDraft>>({});
  readonly flaggedQuestionIds = signal<Set<number>>(new Set<number>());
  readonly remainingSeconds = signal(0);
  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly submitError = signal('');
  readonly result = signal<QuizSubmissionResult | null>(null);
  readonly tabSwitchCount = signal(0);
  readonly instructorWarning = signal('');

  readonly currentQuestion = computed<StudentQuizQuestion | null>(() => {
    const quiz = this.quiz();
    return quiz ? quiz.questions[this.currentIndex()] ?? null : null;
  });

  readonly answeredCount = computed(() => Object.keys(this.answers()).length);
  readonly progressPercentage = computed(() => {
    const total = this.quiz()?.questions.length ?? 0;
    return total === 0 ? 0 : Math.round((this.answeredCount() / total) * 100);
  });
  readonly formattedTime = computed(() => {
    const totalSeconds = this.remainingSeconds();
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  });

  ngOnInit(): void {
    const quizId = Number(this.route.snapshot.paramMap.get('quizId'));

    if (!quizId) {
      this.loading.set(false);
      this.submitError.set('Quiz not found.');
      return;
    }

    this.quizService.getQuiz(quizId).subscribe({
      next: (response) => {
        this.quiz.set(response.data);
        this.remainingSeconds.set(Math.max(response.data.timeLimit, 1) * 60);
        this.loading.set(false);
        this.startTimer();
        this.startMonitoringSession(response.data.id);
      },
      error: () => {
        this.loading.set(false);
        this.submitError.set('Unable to load this quiz right now.');
      },
    });

    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  ngOnDestroy(): void {
    this.stopTimer();
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.warningSubscription?.unsubscribe();
    this.forceSubmitSubscription?.unsubscribe();
  }

  selectQuestion(index: number): void {
    this.currentIndex.set(index);
  }

  previousQuestion(): void {
    this.currentIndex.update((index) => Math.max(index - 1, 0));
  }

  nextQuestion(): void {
    const lastIndex = (this.quiz()?.questions.length ?? 1) - 1;
    this.currentIndex.update((index) => Math.min(index + 1, lastIndex));
  }

  selectChoice(questionId: number, choiceId: number): void {
    this.answers.update((answers) => ({
      ...answers,
      [questionId]: { choiceId, answer: null },
    }));
  }

  selectTextAnswer(questionId: number, answer: string): void {
    this.answers.update((answers) => ({
      ...answers,
      [questionId]: { answer, choiceId: null },
    }));
  }

  toggleFlag(questionId: number): void {
    this.flaggedQuestionIds.update((flagged) => {
      const next = new Set(flagged);
      next.has(questionId) ? next.delete(questionId) : next.add(questionId);
      return next;
    });
  }

  isAnswered(questionId: number): boolean {
    const answer = this.answers()[questionId];
    return !!answer && (!!answer.choiceId || !!answer.answer?.trim());
  }

  isFlagged(questionId: number): boolean {
    return this.flaggedQuestionIds().has(questionId);
  }

  isChoiceSelected(questionId: number, choiceId: number): boolean {
    return this.answers()[questionId]?.choiceId === choiceId;
  }

  getTextAnswer(questionId: number): string {
    return this.answers()[questionId]?.answer ?? '';
  }

  questionLabel(index: number): string {
    return String.fromCharCode(65 + index);
  }

  questionTypeLabel(questionType: string): string {
    return questionType
      .replace('_', ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  submitQuiz(forced = false): void {
    const quiz = this.quiz();
    const studentId = this.auth.getUserId();

    if (!quiz || !studentId || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.submitError.set(forced ? 'Your instructor forced this quiz to submit.' : '');

    this.quizService
      .submitQuiz({
        quizId: quiz.id,
        studentId,
        answers: this.buildSubmissionAnswers(quiz),
      })
      .subscribe({
        next: (response) => {
          this.result.set(response.data);
          this.submitting.set(false);
          this.stopTimer();
        },
        error: (error) => {
          this.submitting.set(false);
          this.submitError.set(error?.error?.message ?? 'Unable to submit this quiz.');
        },
      });
  }

  private buildSubmissionAnswers(quiz: StudentQuiz): StudentQuizAnswer[] {
    const answers = this.answers();

    return quiz.questions.map((question) => ({
      questionId: question.id,
      answer: answers[question.id]?.answer ?? null,
      choiceId: answers[question.id]?.choiceId ?? null,
    }));
  }

  private startTimer(): void {
    this.stopTimer();
    this.timerId = window.setInterval(() => {
      this.remainingSeconds.update((seconds) => {
        if (seconds <= 1) {
          this.stopTimer();
          this.submitQuiz();
          return 0;
        }

        return seconds - 1;
      });
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private readonly handleVisibilityChange = (): void => {
    if (document.hidden && !this.result()) {
      this.tabSwitchCount.update((count) => count + 1);
      const quiz = this.quiz();
      const studentId = this.auth.getUserId();

      if (quiz && studentId) {
        this.quizService.recordTabSwitch(studentId, quiz.id).subscribe();
      }
    }
  };

  private startMonitoringSession(quizId: number): void {
    const studentId = this.auth.getUserId();
    if (!studentId) {
      return;
    }

    this.realtime.joinStudentQuiz(quizId, studentId);

    this.warningSubscription = this.realtime.warning$.subscribe((event) => {
      if (event.quizId === quizId && event.studentId === studentId) {
        this.instructorWarning.set(event.message);
      }
    });

    this.forceSubmitSubscription = this.realtime.forceSubmit$.subscribe((event) => {
      if (event.quizId === quizId && event.studentId === studentId && !this.result()) {
        this.submitQuiz(true);
      }
    });
  }
}
