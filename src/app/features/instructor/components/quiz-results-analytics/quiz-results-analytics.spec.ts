import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { QuizResultsAnalytics } from './quiz-results-analytics';
import { QuizLeaderboard, QuizLeaderboardRow } from '../../interfaces/quiz-leaderboard.model';

function row(percentage: number): QuizLeaderboardRow {
  return { rank: 1, studentId: String(percentage), fullName: 'Student', studentNumber: '001', section: 'A',
    score: percentage, totalPoints: 100, percentage, deltaFromAverage: 0, passed: percentage >= 60,
    submittedAt: null, timeTakenSeconds: null };
}

const results: QuizLeaderboard = {
  quizId: 1, quizTitle: 'Quiz', classroomId: 'c1', totalPoints: 6, passingScore: 60,
  enrolledCount: 5, submittedCount: 3, classAveragePercentage: 50,
  rows: [row(100), row(50), row(0)],
  itemAnalysis: [
    { questionId: 5, itemNumber: 1, text: 'Which algorithm is correct?', questionType: 'multiple_choice', points: 2, correctCount: 2, incorrectCount: 1, unansweredCount: 0, correctPercentage: 66.7 },
    { questionId: 8, itemNumber: 2, text: 'Define a queue.', questionType: 'short_answer', points: 3, correctCount: 1, incorrectCount: 1, unansweredCount: 1, correctPercentage: 33.3 },
    { questionId: 10, itemNumber: 3, text: 'A stack uses LIFO.', questionType: 'true_false', points: 1, correctCount: 3, incorrectCount: 0, unansweredCount: 0, correctPercentage: 100 },
  ],
};

describe('Quiz results analytics', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [QuizResultsAnalytics] }));

  function render(data = results) {
    const fixture = TestBed.createComponent(QuizResultsAnalytics);
    fixture.componentRef.setInput('results', data);
    fixture.detectChanges();
    return fixture;
  }

  it('shows every question and correct/incorrect/unanswered counts with accessible charts', () => {
    const fixture = render();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('.item-table tbody tr')).toHaveLength(3);
    expect(element.textContent).toContain('Define a queue.');
    expect(element.querySelectorAll('.item-table tbody tr')[1].textContent).toContain('33.3%');
    const bar = element.querySelectorAll('.stack')[1];
    expect(bar.getAttribute('aria-label')).toBe('Item 2: 1 correct, 1 incorrect, 1 unanswered');
    expect((bar.querySelector('.unanswered') as HTMLElement).style.width).toBe('33.333333333333336%');
    expect(element.querySelector('.histogram')?.getAttribute('aria-label')).toContain('80-100%: 1 students');
    expect(fixture.componentInstance.passed()).toBe(1);
    expect(fixture.componentInstance.passRate()).toBeCloseTo(33.333);
    expect(fixture.componentInstance.median()).toBe(50);
  });

  it('sorts both table and chart by lowest correct rate without changing source data', () => {
    const fixture = render();
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    select.value = 'lowest';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(fixture.componentInstance.items().map(item => item.itemNumber)).toEqual([2, 1, 3]);
    expect(fixture.nativeElement.querySelector('.question-number').textContent).toBe('Q2');
    expect(fixture.nativeElement.querySelector('.item-label').textContent).toBe('Q2');
    expect(results.itemAnalysis[0].itemNumber).toBe(1);
  });

  it('puts score boundaries and perfect scores in exactly one histogram band', () => {
    const rows = [0, 19.9, 20, 39.9, 40, 59.9, 60, 79.9, 80, 100].map(row);
    const fixture = render({ ...results, rows, submittedCount: rows.length });
    expect(fixture.componentInstance.scoreBands().map(band => band.count)).toEqual([2, 2, 2, 2, 2]);
    expect(fixture.componentInstance.scoreBands().reduce((sum, band) => sum + band.count, 0)).toBe(10);
    expect(fixture.componentInstance.median()).toBeCloseTo(49.95);
  });

  it('shows unanswered counts without using enrolled students as the denominator', () => {
    const fixture = render();
    expect(fixture.componentInstance.share(1)).toBeCloseTo(100 / 3);
    expect(fixture.componentInstance.share(3)).toBe(100);
  });

  it('shows no invented percentages or charts before any submission', () => {
    const fixture = render({ ...results, rows: [], submittedCount: 0, classAveragePercentage: null,
      itemAnalysis: results.itemAnalysis.map(item => ({ ...item, correctCount: 0, incorrectCount: 0, unansweredCount: 0, correctPercentage: null })) });
    expect(fixture.componentInstance.passRate()).toBeNull();
    expect(fixture.componentInstance.median()).toBeNull();
    expect(fixture.componentInstance.share(0)).toBe(0);
    expect(fixture.nativeElement.querySelector('.charts')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('after the first submission');
    expect(fixture.nativeElement.querySelectorAll('.item-table tbody tr')).toHaveLength(3);
    expect(fixture.nativeElement.textContent).not.toContain('NaN');
  });

  it('updates charts and items when another quiz is selected', () => {
    const fixture = render();
    fixture.componentRef.setInput('results', { ...results, quizId: 2, rows: [row(80)], submittedCount: 1, itemAnalysis: [] });
    fixture.detectChanges();
    expect(fixture.componentInstance.passed()).toBe(1);
    expect(fixture.componentInstance.passRate()).toBe(100);
    expect(fixture.componentInstance.median()).toBe(80);
    expect(fixture.nativeElement.querySelectorAll('.item-bar-row')).toHaveLength(0);
    expect(fixture.nativeElement.textContent).toContain('No question items available.');
  });
});
