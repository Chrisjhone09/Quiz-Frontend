import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QuizSettings } from '../../components/quiz-generator/quiz-settings/quiz-settings';
import {
  allocationError,
  QuestionTypeSettings,
} from '../../components/question-type-settings/question-type-settings';
import { InstructorClassroomService } from '../../services/instructor-classroom-service';
import { QuizSettingsService } from '../../services/quiz-settings-service';
import { ManualQuizBuilder } from './manual-quiz-builder';

describe('AI quiz question settings', () => {
  let fixture: ComponentFixture<ManualQuizBuilder>;
  let service: QuizSettingsService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [ManualQuizBuilder, QuizSettings, QuestionTypeSettings],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({}),
              queryParamMap: convertToParamMap({}),
              data: { mode: 'ai' },
            },
          },
        },
        {
          provide: InstructorClassroomService,
          useValue: {
            getClassrooms: () => of([{ id: 'classroom-1', classroomTitle: 'Biology' }]),
          },
        },
      ],
    });
    service = TestBed.inject(QuizSettingsService);
    vi.spyOn(service, 'generateQuiz').mockReturnValue(
      of({ success: false, message: 'Test response', data: null! }),
    );
    fixture = TestBed.createComponent(ManualQuizBuilder);
    await fixture.whenStable();
    fixture.componentInstance.onAiFileSelected({
      target: {
        files: [new File(['Test source'], 'source.pdf', { type: 'application/pdf' })],
      },
    } as unknown as Event);
  });

  it('removes the difficulty and question-mix dropdowns', () => {
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).not.toContain('Difficulty');
    expect(element.textContent).not.toContain('Question Type Mix');
    expect(
      element.querySelectorAll('app-question-type-settings input[type="checkbox"]').length,
    ).toBe(3);
    expect(element.querySelector('app-question-type-settings output')!.textContent).toBe('15');
  });

  it('sends hard difficulty and exact item counts for selected types', () => {
    fixture.componentInstance.aiAllocations.set([
      { type: 'multiple_choice', count: 8 },
      { type: 'short_answer', count: 2 },
    ]);
    fixture.componentInstance.generateWithAi();
    const data = vi.mocked(service.generateQuiz).mock.calls[0][0];
    const settings = JSON.parse(data.get('quizSettings') as string);
    expect(settings).toMatchObject({
      difficulty: 'Hard',
      types: ['multiple_choice', 'short_answer'],
      questionType: 'Mixed',
      numberOfQuestions: 10,
      questionTypeCounts: { multiple_choice: 8, short_answer: 2 },
    });
    expect(data.getAll('files')).toHaveLength(1);
  });

  it('sends a single selected type without the mixed setting', () => {
    fixture.componentInstance.aiAllocations.set([{ type: 'true_false', count: 6 }]);
    fixture.componentInstance.generateWithAi();
    const settings = JSON.parse(
      vi.mocked(service.generateQuiz).mock.calls[0][0].get('quizSettings') as string,
    );
    expect(settings).toMatchObject({
      questionType: 'true_false',
      types: ['true_false'],
      numberOfQuestions: 6,
    });
  });

  it('blocks generation when no type is selected', () => {
    fixture.componentInstance.aiAllocations.set([]);
    fixture.componentInstance.generateWithAi();
    expect(service.generateQuiz).not.toHaveBeenCalled();
    expect(fixture.componentInstance.errorMessage()).toContain('Select at least one');
  });

  for (const count of [null, 0, -1, 1.5, 51, NaN]) {
    it(`blocks an invalid item count: ${count}`, () => {
      fixture.componentInstance.aiAllocations.set([{ type: 'multiple_choice', count }]);
      fixture.componentInstance.generateWithAi();
      expect(service.generateQuiz).not.toHaveBeenCalled();
      expect(fixture.componentInstance.errorMessage()).toContain('whole number');
    });
  }

  it('blocks totals over 50 and permits exactly 50', () => {
    expect(
      allocationError([
        { type: 'multiple_choice', count: 30 },
        { type: 'true_false', count: 21 },
      ]),
    ).toContain('exceed 50');
    expect(
      allocationError([
        { type: 'multiple_choice', count: 30 },
        { type: 'true_false', count: 20 },
      ]),
    ).toBe('');
  });

  it('updates the total and disables the count when a type is unchecked', async () => {
    const element: HTMLElement = fixture.nativeElement;
    const checkbox = element.querySelector<HTMLInputElement>(
      'app-question-type-settings input[type="checkbox"]',
    )!;
    checkbox.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.aiAllocations().map(({ type }) => type)).not.toContain(
      'multiple_choice',
    );
    expect(
      element.querySelector<HTMLInputElement>('[aria-label="Multiple Choice items"]')!.disabled,
    ).toBe(true);
    expect(element.querySelector('output')!.textContent).toBe('10');
  });

  it('keeps a selected type checked while its count is temporarily empty', async () => {
    const element: HTMLElement = fixture.nativeElement;
    const input = element.querySelector<HTMLInputElement>('[aria-label="Multiple Choice items"]')!;
    input.value = '';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(element.querySelector<HTMLInputElement>('input[type="checkbox"]')!.checked).toBe(true);
    expect(fixture.componentInstance.aiAllocations()[0].count).toBeNull();
  });

  it('locks question type controls while generation is in progress', async () => {
    fixture.componentInstance.generating.set(true);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('fieldset')!.disabled).toBe(true);
    fixture.componentInstance.generateWithAi();
    expect(service.generateQuiz).not.toHaveBeenCalled();
  });

  it('applies the same allocation settings in the upload wizard', async () => {
    const settingsFixture = TestBed.createComponent(QuizSettings);
    await settingsFixture.whenStable();
    settingsFixture.componentInstance.allocations.set([{ type: 'short_answer', count: 12 }]);
    expect(settingsFixture.componentInstance.submitSettings()).toMatchObject({
      difficulty: 'Hard',
      classroomId: 'classroom-1',
      questionType: 'short_answer',
      types: ['short_answer'],
      numberOfQuestions: 12,
      questionTypeCounts: { short_answer: 12 },
    });
    settingsFixture.componentInstance.allocations.set([]);
    expect(settingsFixture.componentInstance.submitSettings()).toBeUndefined();
    expect(settingsFixture.componentInstance.allocationError()).toContain('Select at least one');
  });

  it('restores saved per-type counts in the upload wizard', async () => {
    service.updateSettings({ questionTypeCounts: { true_false: 7 }, numberOfQuestions: 7 });
    const settingsFixture = TestBed.createComponent(QuizSettings);
    await settingsFixture.whenStable();
    expect(settingsFixture.componentInstance.allocations()).toEqual([
      { type: 'true_false', count: 7 },
    ]);
  });
});
