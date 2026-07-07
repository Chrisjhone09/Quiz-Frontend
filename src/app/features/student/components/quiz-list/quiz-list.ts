import { Component, computed, input } from '@angular/core';
import { QuizModel } from '../../interfaces/quiz.model';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-quiz-list',
  imports: [NgClass, RouterLink],
  templateUrl: './quiz-list.html',
  styleUrl: './quiz-list.css',
})
export class QuizList {

  quizzes = input<QuizModel[] | null>(null);

  pendingQuizzes = computed(() =>
    (this.quizzes() ?? []).filter((quiz) => !this.isCompleted(quiz))
  );

  completedQuizzes = computed(() =>
    (this.quizzes() ?? []).filter((quiz) => this.isCompleted(quiz))
  );

  isCompleted(quiz: QuizModel): boolean {
    return quiz.status?.toLowerCase() === 'completed';
  }

  isAvailable(quiz: QuizModel): boolean {
    return !this.isCompleted(quiz) && !this.isUpcoming(quiz) && !this.isPastDue(quiz);
  }

  isUpcoming(quiz: QuizModel): boolean {
    const openAt = this.buildDate(quiz.openDate, quiz.openTime);
    return !!openAt && new Date() < openAt;
  }

  isPastDue(quiz: QuizModel): boolean {
    const closeAt = this.buildDate(quiz.closeDate, quiz.closeTime);
    return !!closeAt && new Date() > closeAt && !this.isCompleted(quiz);
  }

  statusLabel(quiz: QuizModel): string {
    if (this.isCompleted(quiz)) {
      return 'Completed';
    }

    if (this.isPastDue(quiz)) {
      return 'Past Due';
    }

    return this.isUpcoming(quiz) ? 'Upcoming' : 'Available';
  }

  statusClass(quiz: QuizModel): string {
    return this.statusLabel(quiz).toLowerCase().replace(' ', '-');
  }

  dueLabel(quiz: QuizModel): string {
    const closeAt = this.buildDate(quiz.closeDate, quiz.closeTime);
    return closeAt ? `Due: ${this.formatDateTime(closeAt)}` : quiz.dueDate ?? 'No due date';
  }

  openLabel(quiz: QuizModel): string {
    const openAt = this.buildDate(quiz.openDate, quiz.openTime);
    return openAt ? `Opens: ${this.formatDateTime(openAt)}` : 'Available now';
  }

  scoreLabel(quiz: QuizModel): string {
    if (quiz.score === null || quiz.score === undefined) {
      return 'Score unavailable';
    }

    return quiz.totalPoints ? `${quiz.score}/${quiz.totalPoints}` : `${quiz.score}`;
  }

  private buildDate(date?: string | null, time?: string | null): Date | null {
    if (!date) {
      return null;
    }

    const normalizedTime = time?.split('.')[0] || '00:00:00';
    const value = new Date(`${date}T${normalizedTime}`);
    return Number.isNaN(value.getTime()) ? null : value;
  }

  private formatDateTime(value: Date): string {
    return value.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }


}
