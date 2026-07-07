import { Component, computed, inject, signal } from '@angular/core';
import { form, FormField, FormRoot } from '@angular/forms/signals';
import { SourceMaterial } from '../quiz-generator.models';
import { QuizCreationModel, QuizResponseModel } from '../../../interfaces/quizCreation.model';
import { QuizSettingsService } from '../../../services/quiz-settings-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-publish-quiz-step',
  imports: [FormRoot, FormField],
  templateUrl: './publish-quiz-step.html',
  styleUrl: './publish-quiz-step.css',
})
export class PublishQuizStep {
  private readonly quizSettingsService = inject(QuizSettingsService);
  private readonly router = inject(Router);
  private readonly initialSchedule = this.createInitialSchedule();
  readonly quiz = signal<QuizResponseModel | null>(this.quizSettingsService.generatedQuiz());

  readonly publishSettingsModel = signal<QuizCreationModel>({
    ...this.quizSettingsService.createDefaultSettings(),
    ...this.quizSettingsService.quizSettings(),
    ...this.initialSchedule,
    scheduleEnabled: this.quizSettingsService.quizSettings()?.scheduleEnabled ?? true,
    scheduledOpeningEnabled: this.quizSettingsService.quizSettings()?.scheduledOpeningEnabled ?? false,
    notifyStudents: true,
    autoReleaseScore: this.quizSettingsService.quizSettings()?.autoReleaseScore ?? true,
  });

  readonly publishSettingsForm = form(this.publishSettingsModel, {
    submission: {
      action: async () => {
        this.submitPublishSettings();
      },
    },
  });

  readonly summary = computed(() => ({
    ...this.quizSettingsService.createDefaultSettings(),
    ...this.quizSettingsService.quizSettings(),
    ...this.publishSettingsModel(),
  }));

  readonly questionTypes = computed(() => {
    const types = this.summary().types;
    return types.length ? types : ['Mixed'];
  });

  readonly sourceFiles = signal<SourceMaterial[]>([
    { id: 1, name: 'CS101_Syllabus.pdf', status: 'Ready' },
    { id: 2, name: 'Week4_Trees_Slides.pdf', status: 'Ready' },
  ]);

  readonly scheduleDuration = computed(() => {
    const settings = this.summary();

    if (!settings.scheduleEnabled) {
      return 'Available immediately with no expiry';
    }

    if (settings.scheduledOpeningEnabled) {
      if (!settings.openDate || !settings.openTime || !settings.closeDate || !settings.closeTime) {
        return 'Schedule is incomplete';
      }

      return `${this.formatDateLabel(settings.openDate)} ${settings.openTime} to ${this.formatDateLabel(settings.closeDate)} ${settings.closeTime}`;
    }

    if (!settings.expiresAt) {
      return 'Schedule is incomplete';
    }

    return `Available now until ${this.formatDateLabel(settings.closeDate)} ${settings.expiresAt}`;
  });

  saveDraft(): void {
    const settings = this.submitPublishSettings();
    const quiz = this.quiz();

    if (!quiz) {
      return;
    }

    this.quizSettingsService.saveDraft(quiz.id, quiz, settings).subscribe({
      next: (result) => {
        if (result.success && result.data) {
          this.quiz.set(result.data);
          this.quizSettingsService.setGeneratedQuiz(result.data);
        }
      },
      error: (error) => console.error('Draft save failed', error),
    });
  }

  publishNow(): void {
    const settings = this.submitPublishSettings();
    const quiz = this.quiz();

    if (!quiz) {
      return;
    }

    this.quizSettingsService.publishQuiz(quiz.id, quiz, settings).subscribe({
      next: (result) => {
        if (!result.success || !result.data) {
          console.error(result.message || 'Quiz publish failed');
          return;
        }

        this.quiz.set(result.data);
        this.quizSettingsService.setGeneratedQuiz(result.data);
        this.router.navigate(['/instructor-classroom', result.data.classroomId, 'quizzes']);
      },
      error: (error) => console.error('Quiz publish failed', error),
    });
  }

  private submitPublishSettings(): QuizCreationModel {
    const currentSettings = this.publishSettingsModel();
    const nowSchedule = this.createInitialSchedule();
    const openDate = currentSettings.scheduledOpeningEnabled
      ? currentSettings.openDate
      : nowSchedule.openDate;
    const openTime = currentSettings.scheduledOpeningEnabled
      ? currentSettings.openTime
      : nowSchedule.openTime;
    const closeDate = currentSettings.scheduleEnabled
      ? currentSettings.scheduledOpeningEnabled
        ? currentSettings.closeDate
        : openDate
      : '';
    const closeTime = currentSettings.scheduleEnabled
      ? currentSettings.scheduledOpeningEnabled
        ? currentSettings.closeTime
        : currentSettings.expiresAt
      : '';

    const settings = {
      ...currentSettings,
      openDate,
      openTime,
      closeDate,
      closeTime,
      openAt: this.combineDateTime(
        openDate,
        openTime,
      ),
      validUntil: currentSettings.scheduleEnabled
        ? this.combineDateTime(closeDate, closeTime)
        : '',
    };

    this.quizSettingsService.updateSettings(settings);
    this.publishSettingsModel.set(settings);

    return settings;
  }

  private combineDateTime(date?: string, time?: string): string {
    if (!date) {
      return '';
    }

    return `${date}T${time || '00:00'}`;
  }

  private createInitialSchedule(): Pick<
    QuizCreationModel,
    'openDate' | 'openTime' | 'closeDate' | 'closeTime' | 'expiresAt'
  > {
    const now = new Date();
    const openDate = this.toDateInputValue(now);
    const openTime = this.toTimeInputValue(now);
    const expiresAt = '23:59';

    return {
      openDate,
      openTime,
      closeDate: openDate,
      closeTime: expiresAt,
      expiresAt,
    };
  }

  private toDateInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private toTimeInputValue(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${hours}:${minutes}`;
  }

  private formatDateLabel(dateValue: string): string {
    if (!dateValue) {
      return '';
    }

    const [year, month, day] = dateValue.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: '2-digit',
      year: 'numeric',
    }).format(date);
  }
}
