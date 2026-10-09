import { Injectable, signal } from '@angular/core';
import { DEFAULT_QUIZ_DEFAULTS, QuizDefaultsModel } from '../interfaces/quizDefaults.model';

const STORAGE_KEY = 'quizAi.instructorQuizDefaults';

/** Per-browser "remember my usual quiz settings" preferences, set from the Settings page and
 * read by the quiz builder (manual creation + AI generation) to pre-fill new quizzes. Stored in
 * localStorage rather than the backend since it's a lightweight per-device convenience rather
 * than account data that needs to sync across devices. */
@Injectable({
  providedIn: 'root',
})
export class QuizDefaultsService {
  readonly defaults = signal<QuizDefaultsModel>(this.load());

  private load(): QuizDefaultsModel {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return { ...DEFAULT_QUIZ_DEFAULTS };
      }
      const parsed = JSON.parse(raw);
      return {
        timeLimit: Number(parsed?.timeLimit) > 0 ? Number(parsed.timeLimit) : DEFAULT_QUIZ_DEFAULTS.timeLimit,
        passingScore: Number.isFinite(Number(parsed?.passingScore))
          ? Number(parsed.passingScore)
          : DEFAULT_QUIZ_DEFAULTS.passingScore,
        notifyStudents: typeof parsed?.notifyStudents === 'boolean' ? parsed.notifyStudents : DEFAULT_QUIZ_DEFAULTS.notifyStudents,
        autoReleaseScore:
          typeof parsed?.autoReleaseScore === 'boolean' ? parsed.autoReleaseScore : DEFAULT_QUIZ_DEFAULTS.autoReleaseScore,
      };
    } catch {
      return { ...DEFAULT_QUIZ_DEFAULTS };
    }
  }

  save(defaults: QuizDefaultsModel): void {
    this.defaults.set(defaults);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    } catch {
      // Ignore storage failures (private browsing, quota, etc.) — defaults() is already
      // updated in-memory for the rest of this session.
    }
  }

  reset(): void {
    this.save({ ...DEFAULT_QUIZ_DEFAULTS });
  }
}
