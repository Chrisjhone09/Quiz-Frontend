import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { InstructorQuizList } from './instructor-quiz-list';
import { InstructorClassroomService } from '../../services/instructor-classroom-service';
import { QuizModel } from '../../../student/interfaces/quiz.model';

describe('InstructorQuizList', () => {
  let component: InstructorQuizList;
  let fixture: ComponentFixture<InstructorQuizList>;
  let getQuizzes: ReturnType<typeof vi.fn>;
  const quiz: QuizModel = {
    id: 1, quizTitle: 'Biology', numberOfQuestions: 10, dueDate: '', duration: 30,
    status: 'Published', submissions: 2, publishDate: '2004-07-09T00:00:00Z',
    closeDate: '2004-07-09', closeTime: '09:30:00',
  };

  beforeEach(async () => {
    getQuizzes = vi.fn(() => of([quiz]));
    await TestBed.configureTestingModule({
      imports: [InstructorQuizList],
      providers: [
        { provide: ActivatedRoute, useValue: { parent: { snapshot: { paramMap: { get: () => 'c1' } } } } },
        { provide: InstructorClassroomService, useValue: { getQuizzes } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InstructorQuizList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(getQuizzes).toHaveBeenCalledWith('c1');
  });

  it('renders publish dates and scheduled due times using the imported pipes', () => {
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('[data-label="Publish Date"]')?.textContent?.trim()).toBe('July 9 2004');
    expect(element.querySelector('[data-label="Due Date"]')?.textContent?.trim()).toBe('July 9 2004 at 9:30 AM PHT');
  });

  it('renders recent publish timestamps as relative time', async () => {
    component.quizzes.set([{ ...quiz, publishDate: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() }]);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[data-label="Publish Date"]').textContent.trim()).toBe('3 hours ago');
  });

  it('handles an absent due date and an optional closing time', async () => {
    component.quizzes.set([{ ...quiz, closeDate: null, closeTime: null }]);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[data-label="Due Date"]').textContent.trim()).toBe('No due date');
    component.quizzes.set([{ ...quiz, closeTime: undefined }]);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[data-label="Due Date"]').textContent.trim()).toBe('July 9 2004');
  });
});
