import { DecimalPipe } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { QuizItemAnalysis, QuizLeaderboard } from '../../interfaces/quiz-leaderboard.model';

@Component({
  selector: 'app-quiz-results-analytics',
  imports: [DecimalPipe, MatIconModule],
  templateUrl: './quiz-results-analytics.html',
  styleUrl: './quiz-results-analytics.css',
})
export class QuizResultsAnalytics {
  readonly results = input.required<QuizLeaderboard>();
  readonly sort = signal('item');
  readonly items = computed(() => {
    const items = [...(this.results().itemAnalysis ?? [])];
    return this.sort() === 'lowest'
      ? items.sort((a, b) => (a.correctPercentage ?? 0) - (b.correctPercentage ?? 0) || a.itemNumber - b.itemNumber)
      : items.sort((a, b) => a.itemNumber - b.itemNumber);
  });
  readonly passed = computed(() => this.results().rows.filter(row => row.passed).length);
  readonly failed = computed(() => this.results().rows.length - this.passed());
  readonly passRate = computed(() => this.results().rows.length
    ? this.passed() * 100 / this.results().rows.length : null);
  readonly median = computed(() => {
    const scores = this.results().rows.map(row => row.percentage).sort((a, b) => a - b);
    const middle = Math.floor(scores.length / 2);
    return scores.length ? (scores.length % 2 ? scores[middle] : (scores[middle - 1] + scores[middle]) / 2) : null;
  });
  readonly scoreBands = computed(() => {
    const bands = ['0-19%', '20-39%', '40-59%', '60-79%', '80-100%'].map(label => ({ label, count: 0 }));
    for (const row of this.results().rows) {
      bands[Math.min(4, Math.max(0, Math.floor(row.percentage / 20)))].count++;
    }
    const max = Math.max(1, ...bands.map(band => band.count));
    return bands.map(band => ({ ...band, height: band.count * 100 / max }));
  });
  readonly maxBandCount = computed(() => Math.max(1, ...this.scoreBands().map(band => band.count)));
  readonly scoreChartLabel = computed(() => 'Score distribution: ' + this.scoreBands()
    .map(band => `${band.label}: ${band.count} students`).join('; '));

  share(count: number): number {
    return this.results().submittedCount ? count * 100 / this.results().submittedCount : 0;
  }

  itemLabel(item: QuizItemAnalysis): string {
    return `Item ${item.itemNumber}: ${item.correctCount} correct, ${item.incorrectCount} incorrect, ${item.unansweredCount} unanswered`;
  }

  typeLabel(type: string): string {
    return ({ multiple_choice: 'Multiple choice', short_answer: 'Short answer', true_false: 'True or false' } as Record<string, string>)[type] ?? type;
  }
}
