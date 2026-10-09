import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InstructorClassroomService } from '../../services/instructor-classroom-service';
import { QuizSettingsService } from '../../services/quiz-settings-service';
import { QuizDefaultsService } from '../../services/quiz-defaults-service';
import { QuestionType, QuestionTypeAllocation, QuizChoiceModel, QuizQuestionModel, QuizResponseModel } from '../../interfaces/quizCreation.model';
import { allocationError, defaultQuestionAllocations, QuestionTypeSettings } from '../../components/question-type-settings/question-type-settings';
import { ClassroomModel } from '../../../../shared/interfaces/classrooms.model';
import { philippineInputValues } from '../../../../shared/utils/philippine-time';

/** How the builder was entered:
 *  - 'manual' — instructor is authoring a brand new quiz by hand (Add Quiz)
 *  - 'ai'     — instructor is generating a new quiz from an uploaded file (Generate AI Quiz)
 *  - 'edit'   — instructor is editing a quiz that already exists (manual or AI-generated) */
type EntryMode = 'manual' | 'ai' | 'edit';

/** A question mid-authoring. Choice/question ids here are client-only sequence numbers —
 * ReplaceQuestionsAsync on the backend rebuilds everything fresh from this payload and
 * only uses them to match correctChoiceId back to a choice within the same question. */
interface DraftQuestion {
  key: number;
  questionType: QuestionType;
  text: string;
  points: number;
  choices: QuizChoiceModel[];
  correctChoiceId: number | null;
  correctAnswer: string;
}

@Component({
  selector: 'app-manual-quiz-builder',
  imports: [CommonModule, FormsModule, RouterLink, QuestionTypeSettings],
  templateUrl: './manual-quiz-builder.html',
  styleUrl: './manual-quiz-builder.css',
})
export class ManualQuizBuilder implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly classroomService = inject(InstructorClassroomService);
  private readonly quizSettingsService = inject(QuizSettingsService);
  private readonly quizDefaultsService = inject(QuizDefaultsService);

  readonly entryMode = signal<EntryMode>('manual');

  /** 'setup' is the AI-only pre-generation step (upload + settings). Every other combination
   * (manual authoring, editing an existing quiz, or an AI quiz post-generation) shows the same
   * shared Quiz Details + Questions editor, so the UI stays identical no matter how you got here. */
  readonly phase = signal<'setup' | 'editing'>('editing');
  readonly generating = signal(false);

  /** Present (and > 0) once a quiz row actually exists in the database — either because we're
   * editing one, or because AI generation just created one. Both cases save via
   * save-draft/publish-quiz instead of the "create" endpoint, and both lock the classroom picker.
   * Backed by a signal (rather than a plain field) so `isEditing` correctly recomputes the moment
   * AI generation assigns an id partway through the component's lifetime. */
  private readonly quizIdSignal = signal<number | null>(null);
  private get quizId(): number | null {
    return this.quizIdSignal();
  }
  private set quizId(value: number | null) {
    this.quizIdSignal.set(value);
  }
  readonly isEditing = computed(() => this.quizIdSignal() != null);
  readonly quizLoading = signal(false);
  readonly selectedClassroomName = signal('');

  readonly headerTitle = computed(() => {
    if (this.entryMode() === 'edit') return 'Edit Quiz';
    if (this.entryMode() === 'ai') return this.phase() === 'setup' ? 'Generate Quiz with AI' : 'Review AI-Generated Quiz';
    return 'Create Quiz Manually';
  });

  readonly headerSubtitle = computed(() => {
    if (this.entryMode() === 'edit') return "Update questions, answers, and points — works for AI-generated quizzes too.";
    if (this.entryMode() === 'ai') {
      return this.phase() === 'setup'
        ? 'Upload a syllabus or reference file and let AI draft the quiz — you can edit everything afterward.'
        : 'Review what the AI generated — edit questions, answers, and points before saving, just like a manual quiz.';
    }
    return 'Write your own questions — no file upload or AI generation needed.';
  });

  readonly classrooms = signal<ClassroomModel[]>([]);
  readonly classroomsLoading = signal(true);
  readonly selectedClassroomId = signal('');

  readonly title = signal('Untitled Quiz');
  readonly description = signal('');
  // Seeded from the instructor's saved preferences (Settings → Default Quiz Settings), if any.
  readonly timeLimit = signal(this.quizDefaultsService.defaults().timeLimit);
  readonly passingScore = signal(this.quizDefaultsService.defaults().passingScore);
  readonly notifyStudents = signal(this.quizDefaultsService.defaults().notifyStudents);
  readonly autoReleaseScore = signal(this.quizDefaultsService.defaults().autoReleaseScore);

  readonly publishNow = signal(false);
  readonly openDate = signal('');
  readonly closeDate = signal('');
  readonly openTime = signal('00:00');
  readonly closeTime = signal('23:59');

  // AI generation setup (only used while entryMode === 'ai' && phase === 'setup')
  readonly aiAllocations = signal<QuestionTypeAllocation[]>(defaultQuestionAllocations());
  readonly aiFileNames = signal<string[]>([]);
  private aiFiles: File[] = [];

  readonly questions = signal<DraftQuestion[]>([]);
  private nextKey = 1;

  readonly totalPoints = computed(() =>
    this.questions().reduce((sum, question) => sum + (question.points || 0), 0)
  );

  readonly submitting = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly questionTypes: { value: QuestionType; label: string }[] = [
    { value: 'multiple_choice', label: 'Multiple Choice' },
    { value: 'short_answer', label: 'Short Answer' },
    { value: 'true_false', label: 'True or False' },
  ];

  ngOnInit(): void {
    const rawQuizId = this.route.snapshot.paramMap.get('quizId');
    this.quizId = rawQuizId ? Number(rawQuizId) : null;
    const routeMode = this.route.snapshot.data['mode'];

    if (this.quizId != null) {
      this.entryMode.set('edit');
    } else if (routeMode === 'ai') {
      this.entryMode.set('ai');
      this.phase.set('setup');
    } else {
      this.entryMode.set('manual');
    }

    const requestedClassroomId = this.route.snapshot.queryParamMap.get('classroomId') ?? '';

    this.classroomService.getClassrooms().subscribe({
      next: (classrooms) => {
        const list = classrooms ?? [];
        this.classrooms.set(list);
        this.classroomsLoading.set(false);
        if (this.entryMode() === 'edit') {
          const current = list.find((classroom) => classroom.id === this.selectedClassroomId());
          if (current) {
            this.selectedClassroomName.set(current.classroomTitle);
          }
        } else {
          const matches = list.some((classroom) => classroom.id === requestedClassroomId);
          this.selectedClassroomId.set(matches ? requestedClassroomId : (list[0]?.id ?? ''));
        }
      },
      error: () => {
        this.classroomsLoading.set(false);
      },
    });

    // Default schedule for the "publish immediately" path: opens now, due in a week.
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    this.openDate.set(philippineInputValues(today).date);
    this.closeDate.set(philippineInputValues(nextWeek).date);

    if (this.entryMode() === 'edit' && this.quizId != null) {
      this.loadQuiz(this.quizId);
      return;
    }

    if (this.entryMode() === 'manual') {
      this.addQuestion();
    }
    // 'ai' mode starts with zero questions — they arrive once generation completes.
  }

  /** Maps whatever the backend hands back (should already be the normalized snake_case
   * values, but this defensively covers older/differently-cased data too). */
  private normalizeType(value: string | undefined | null): QuestionType {
    const normalized = (value ?? '').trim().toLowerCase();
    if (normalized === 'short_answer' || normalized === 'shortanswer' || normalized === 'identification') {
      return 'short_answer';
    }
    if (normalized === 'true_false' || normalized === 'truefalse' || normalized === 'true/false') {
      return 'true_false';
    }
    return 'multiple_choice';
  }

  /** Strips a trailing :ss (or .fff) from a backend time string so it fits <input type="time">. */
  private toTimeInputValue(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    return value.slice(0, 5);
  }

  /** Populates the shared Quiz Details + Questions form from a persisted quiz — used both when
   * loading an existing quiz to edit, and right after AI generation hands back a freshly-created one. */
  private applyQuizToForm(quiz: QuizResponseModel): void {
    this.title.set(quiz.title || 'Untitled Quiz');
    this.description.set(quiz.description ?? '');
    this.timeLimit.set(quiz.timeLimit ?? 60);
    this.passingScore.set(quiz.passingScore ?? 80);
    this.notifyStudents.set(quiz.notifyStudents ?? true);
    this.autoReleaseScore.set(quiz.autoReleaseResults ?? true);
    this.publishNow.set(quiz.isPublished);
    this.openDate.set(quiz.openDate ?? this.openDate());
    this.closeDate.set(quiz.closeDate ?? this.closeDate());
    this.openTime.set(this.toTimeInputValue(quiz.openTime) || this.openTime());
    this.closeTime.set(this.toTimeInputValue(quiz.closeTime) || this.closeTime());

    if (quiz.classroomId) {
      this.selectedClassroomId.set(quiz.classroomId);
      const match = this.classrooms().find((classroom) => classroom.id === quiz.classroomId);
      if (match) {
        this.selectedClassroomName.set(match.classroomTitle);
      }
    }

    const loadedQuestions: DraftQuestion[] = (quiz.questions ?? []).map((question) => {
      const questionType = this.normalizeType(question.questionType);
      return {
        key: this.nextKey++,
        questionType,
        text: question.text ?? '',
        points: question.points ?? 1,
        choices:
          questionType === 'multiple_choice' && question.choices?.length
            ? question.choices.map((choice) => ({ id: choice.id, text: choice.text }))
            : questionType === 'multiple_choice'
            ? [
                { id: 0, text: '' },
                { id: 1, text: '' },
              ]
            : [],
        correctChoiceId: questionType === 'multiple_choice' ? question.correctChoiceId ?? null : null,
        correctAnswer: questionType !== 'multiple_choice' ? question.correctAnswer ?? '' : '',
      };
    });

    this.questions.set(
      loadedQuestions.length
        ? loadedQuestions
        : [
            {
              key: this.nextKey++,
              questionType: 'multiple_choice',
              text: '',
              points: 1,
              choices: [
                { id: 0, text: '' },
                { id: 1, text: '' },
              ],
              correctChoiceId: 0,
              correctAnswer: '',
            },
          ]
    );
  }

  private loadQuiz(quizId: number): void {
    this.quizLoading.set(true);
    this.quizSettingsService.getQuiz(quizId).subscribe({
      next: (result) => {
        this.quizLoading.set(false);
        if (!result.success || !result.data) {
          this.errorMessage.set(result.message || 'Could not load this quiz.');
          return;
        }
        this.applyQuizToForm(result.data);
      },
      error: (error) => {
        this.quizLoading.set(false);
        const body = error?.error;
        const message = typeof body === 'string' && body.trim() ? body : body?.message;
        this.errorMessage.set(message?.trim() ? message : 'Could not load this quiz.');
      },
    });
  }

  onAiFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.aiFiles = input.files ? Array.from(input.files) : [];
    this.aiFileNames.set(this.aiFiles.map((file) => file.name));
  }

  generateWithAi(): void {
    if (this.generating()) return;
    const error = allocationError(this.aiAllocations());
    if (error) {
      this.errorMessage.set(error);
      return;
    }
    if (!this.selectedClassroomId()) {
      this.errorMessage.set('Choose a classroom for this quiz.');
      return;
    }
    if (this.aiFiles.length === 0) {
      this.errorMessage.set('Upload a file for the AI to generate questions from.');
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');
    this.generating.set(true);

    const quizSettings = {
      ...this.quizSettingsService.createDefaultSettings(),
      title: this.title().trim(),
      description: this.description().trim(),
      classroomId: this.selectedClassroomId(),
      difficulty: 'Hard',
      questionType: this.aiAllocations().length === 1 ? this.aiAllocations()[0].type : 'Mixed',
      types: this.aiAllocations().map(({ type }) => type),
      questionTypeCounts: Object.fromEntries(this.aiAllocations().map(({ type, count }) => [type, count!])),
      numberOfQuestions: this.aiAllocations().reduce((sum, { count }) => sum + count!, 0),
      timeLimit: this.timeLimit(),
      passingScore: this.passingScore(),
      notifyStudents: this.notifyStudents(),
      autoReleaseScore: this.autoReleaseScore(),
    };

    const formData = new FormData();
    formData.append('quizSettings', JSON.stringify(quizSettings));
    for (const file of this.aiFiles) {
      formData.append('files', file, file.name);
    }

    this.quizSettingsService.generateQuiz(formData).subscribe({
      next: (result) => {
        this.generating.set(false);
        if (!result.success || !result.data) {
          this.errorMessage.set(result.message || 'AI could not generate a quiz from this file.');
          return;
        }
        this.quizId = result.data.id;
        this.applyQuizToForm(result.data);
        this.phase.set('editing');
        this.successMessage.set('Quiz generated — review the questions below, adjust anything you like, then save.');
      },
      error: (error) => {
        this.generating.set(false);
        const body = error?.error;
        const message = typeof body === 'string' && body.trim() ? body : body?.message;
        this.errorMessage.set(message?.trim() ? message : 'AI could not generate a quiz. Please try again.');
      },
    });
  }

  addQuestion(): void {
    this.questions.update((current) => [
      ...current,
      {
        key: this.nextKey++,
        questionType: 'multiple_choice',
        text: '',
        points: 1,
        choices: [
          { id: 0, text: '' },
          { id: 1, text: '' },
        ],
        correctChoiceId: 0,
        correctAnswer: '',
      },
    ]);
  }

  removeQuestion(key: number): void {
    this.questions.update((current) => current.filter((question) => question.key !== key));
  }

  setQuestionType(key: number, type: QuestionType): void {
    this.questions.update((current) =>
      current.map((question) => {
        if (question.key !== key) {
          return question;
        }
        if (type === 'multiple_choice' && question.choices.length === 0) {
          return {
            ...question,
            questionType: type,
            choices: [
              { id: 0, text: '' },
              { id: 1, text: '' },
            ],
            correctChoiceId: 0,
          };
        }
        return { ...question, questionType: type };
      })
    );
  }

  updateQuestionText(key: number, text: string): void {
    this.questions.update((current) =>
      current.map((question) => (question.key === key ? { ...question, text } : question))
    );
  }

  updateQuestionPoints(key: number, points: number): void {
    this.questions.update((current) =>
      current.map((question) => (question.key === key ? { ...question, points } : question))
    );
  }

  updateCorrectAnswer(key: number, correctAnswer: string): void {
    this.questions.update((current) =>
      current.map((question) => (question.key === key ? { ...question, correctAnswer } : question))
    );
  }

  addChoice(key: number): void {
    this.questions.update((current) =>
      current.map((question) => {
        if (question.key !== key) {
          return question;
        }
        const nextId = question.choices.length
          ? Math.max(...question.choices.map((choice) => choice.id)) + 1
          : 0;
        return { ...question, choices: [...question.choices, { id: nextId, text: '' }] };
      })
    );
  }

  removeChoice(key: number, choiceId: number): void {
    this.questions.update((current) =>
      current.map((question) => {
        if (question.key !== key) {
          return question;
        }
        const choices = question.choices.filter((choice) => choice.id !== choiceId);
        const correctChoiceId =
          question.correctChoiceId === choiceId ? (choices[0]?.id ?? null) : question.correctChoiceId;
        return { ...question, choices, correctChoiceId };
      })
    );
  }

  updateChoiceText(key: number, choiceId: number, text: string): void {
    this.questions.update((current) =>
      current.map((question) =>
        question.key !== key
          ? question
          : {
              ...question,
              choices: question.choices.map((choice) =>
                choice.id === choiceId ? { ...choice, text } : choice
              ),
            }
      )
    );
  }

  setCorrectChoice(key: number, choiceId: number): void {
    this.questions.update((current) =>
      current.map((question) => (question.key === key ? { ...question, correctChoiceId: choiceId } : question))
    );
  }

  submit(): void {
    const validationError = this.validate();
    if (validationError) {
      this.errorMessage.set(validationError);
      this.successMessage.set('');
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');
    this.submitting.set(true);

    const quizSettings = {
      ...this.quizSettingsService.createDefaultSettings(),
      title: this.title().trim() || 'Untitled Quiz',
      description: this.description().trim(),
      classroomId: this.selectedClassroomId(),
      notifyStudents: this.notifyStudents(),
      autoReleaseScore: this.autoReleaseScore(),
      numberOfQuestions: this.questions().length,
      timeLimit: this.timeLimit(),
      passingScore: this.passingScore(),
      openDate: this.publishNow() ? this.openDate() : '',
      openTime: this.publishNow() ? this.openTime() : '',
      closeDate: this.publishNow() ? this.closeDate() : '',
      closeTime: this.publishNow() ? this.closeTime() : '',
    };

    const questions: QuizQuestionModel[] = this.questions().map((question) => ({
      id: 0,
      text: question.text.trim(),
      points: question.points,
      questionType: question.questionType,
      correctAnswer:
        question.questionType === 'multiple_choice' ? null : question.correctAnswer.trim(),
      correctChoiceId: question.questionType === 'multiple_choice' ? question.correctChoiceId : null,
      choices:
        question.questionType === 'multiple_choice'
          ? question.choices
              .filter((choice) => choice.text.trim())
              .map((choice) => ({ id: choice.id, text: choice.text.trim() }))
          : [],
    }));

    const isEditing = this.isEditing();
    const request$ = isEditing
      ? this.publishNow()
        ? this.quizSettingsService.publishQuizQuestions(this.quizId as number, quizSettings, questions)
        : this.quizSettingsService.saveDraftQuestions(this.quizId as number, quizSettings, questions)
      : this.quizSettingsService.createManualQuiz(quizSettings, questions, this.publishNow());

    request$.subscribe({
      next: (result) => {
        this.submitting.set(false);
        if (!result.success) {
          this.errorMessage.set(result.message || (isEditing ? 'Could not save the quiz.' : 'Could not create the quiz.'));
          return;
        }
        this.successMessage.set(result.message || (isEditing ? 'Quiz saved.' : 'Quiz created.'));
        setTimeout(() => {
          this.router.navigate(['/instructor-classroom', this.selectedClassroomId()]);
        }, 900);
      },
      error: (error) => {
        this.submitting.set(false);
        const body = error?.error;
        const message = typeof body === 'string' && body.trim() ? body : body?.message;
        this.errorMessage.set(
          message?.trim() ? message : isEditing ? 'Could not save the quiz. Please try again.' : 'Could not create the quiz. Please try again.'
        );
      },
    });
  }

  private validate(): string | null {
    if (!this.selectedClassroomId()) {
      return 'Choose a classroom for this quiz.';
    }

    if (this.questions().length === 0) {
      return 'Add at least one question.';
    }

    for (const [index, question] of this.questions().entries()) {
      const position = index + 1;

      if (!question.text.trim()) {
        return `Question ${position} needs text.`;
      }
      if (!question.points || question.points <= 0) {
        return `Question ${position} needs at least 1 point.`;
      }

      if (question.questionType === 'multiple_choice') {
        const filled = question.choices.filter((choice) => choice.text.trim());
        if (filled.length < 2) {
          return `Question ${position} needs at least 2 answer options.`;
        }
        const correctIsFilled = question.choices.some(
          (choice) => choice.id === question.correctChoiceId && choice.text.trim()
        );
        if (question.correctChoiceId == null || !correctIsFilled) {
          return `Question ${position} needs a correct option selected.`;
        }
      } else if (question.questionType === 'short_answer') {
        if (!question.correctAnswer.trim()) {
          return `Question ${position} needs an expected answer.`;
        }
      } else if (question.questionType === 'true_false') {
        if (question.correctAnswer !== 'true' && question.correctAnswer !== 'false') {
          return `Question ${position} needs a True or False answer.`;
        }
      }
    }

    if (this.publishNow() && (!this.openDate() || !this.closeDate())) {
      return 'Set an open and due date to publish immediately.';
    }

    return null;
  }
}
