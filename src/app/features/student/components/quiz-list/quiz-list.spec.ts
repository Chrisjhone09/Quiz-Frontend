import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, vi } from 'vitest';

import { QuizList } from './quiz-list';
import { QuizModel } from '../../interfaces/quiz.model';

describe('QuizList', () => {
  let component: QuizList;
  let fixture: ComponentFixture<QuizList>;
  const quiz: QuizModel = { id: 1, quizTitle: 'Biology', numberOfQuestions: 5, dueDate: '', duration: 10, status: 'Pending', submissions: 0, publishDate: '', closeDate: '2004-07-09' };

  afterEach(() => vi.useRealTimers());

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuizList],
    }).compileComponents();

    fixture = TestBed.createComponent(QuizList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('keeps date-only deadlines available until the end of the Philippine day', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2004-07-09T10:00:00Z'));
    expect(component.isPastDue(quiz)).toBe(false);
    expect(component.dueLabel(quiz)).toBe('Due: July 9 2004');
    vi.setSystemTime(new Date('2004-07-09T16:00:00Z'));
    expect(component.isPastDue(quiz)).toBe(true);
  });

  it('uses PHT for explicit due times regardless of the browser timezone', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2004-07-09T04:59:00Z'));
    const scheduled = { ...quiz, closeTime: '13:00:00' };
    expect(component.isPastDue(scheduled)).toBe(false);
    expect(component.dueLabel(scheduled)).toBe('Due: July 9 2004 at 1:00 PM PHT');
    vi.setSystemTime(new Date('2004-07-09T05:01:00Z'));
    expect(component.isPastDue(scheduled)).toBe(true);
  });

  it('uses PHT for scheduled openings', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2004-07-09T04:00:00Z'));
    const scheduled = { ...quiz, openDate: '2004-07-09', openTime: '13:00:00' };
    expect(component.isUpcoming(scheduled)).toBe(true);
    vi.setSystemTime(new Date('2004-07-09T05:00:00Z'));
    expect(component.isAvailable(scheduled)).toBe(true);
  });
});
