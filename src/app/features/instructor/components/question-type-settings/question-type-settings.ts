import { Component, computed, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QuestionType, QuestionTypeAllocation } from '../../interfaces/quizCreation.model';

export const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'short_answer', label: 'Short Answer' },
  { value: 'true_false', label: 'True or False' },
];

export function defaultQuestionAllocations(): QuestionTypeAllocation[] {
  return QUESTION_TYPES.map(({ value }) => ({ type: value, count: 5 }));
}

export function allocationError(allocations: QuestionTypeAllocation[]): string {
  if (!allocations.length) return 'Select at least one question type.';
  if (
    allocations.some(
      ({ count }) => count == null || !Number.isInteger(count) || count < 1 || count > 50,
    )
  ) {
    return 'Enter a whole number from 1 to 50 for each selected question type.';
  }
  if (allocations.reduce((sum, { count }) => sum + (count ?? 0), 0) > 50) {
    return 'The total number of questions must not exceed 50.';
  }
  return '';
}

@Component({
  selector: 'app-question-type-settings',
  imports: [FormsModule],
  templateUrl: './question-type-settings.html',
  styleUrl: './question-type-settings.css',
})
export class QuestionTypeSettings {
  readonly allocations = model<QuestionTypeAllocation[]>(defaultQuestionAllocations());
  readonly disabled = input(false);
  readonly options = QUESTION_TYPES;
  readonly total = computed(() =>
    this.allocations().reduce((sum, { count }) => sum + (count ?? 0), 0),
  );

  selected(type: QuestionType): boolean {
    return this.allocations().some((item) => item.type === type);
  }

  count(type: QuestionType): number | null {
    return this.allocations().find((item) => item.type === type)?.count ?? null;
  }

  toggle(type: QuestionType, checked: boolean): void {
    this.allocations.update((items) =>
      checked
        ? [...items.filter((item) => item.type !== type), { type, count: 5 }]
        : items.filter((item) => item.type !== type),
    );
  }

  setCount(type: QuestionType, count: number | null): void {
    this.allocations.update((items) =>
      items.map((item) => (item.type === type ? { ...item, count } : item)),
    );
  }
}
