import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { QuizSettingsService } from '../services/quiz-settings-service';

/**
 * Runs when navigating into /quiz-generator. If the link that got us here carried a
 * ?classroomId=<id> (every "Add Quiz" / "Generate AI Quiz" entry point in the app does),
 * seed it into the shared quiz-settings signal before the wizard's own components read
 * it — that's what generate-quiz's classroomId field actually needs, and nothing was
 * ever populating it, which is why every generation attempt 400'd.
 *
 * This only pre-seeds the signal; it doesn't build a classroom picker UI (that lives in
 * the wizard's own step components).
 */
export const quizClassroomGuard: CanActivateFn = (route) => {
  const classroomId = route.queryParamMap.get('classroomId');

  if (classroomId) {
    const quizSettingsService = inject(QuizSettingsService);
    quizSettingsService.updateSettings({ classroomId });
  }

  return true;
};
