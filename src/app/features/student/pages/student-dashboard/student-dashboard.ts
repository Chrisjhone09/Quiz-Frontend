import { Component, computed, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ClassroomModel } from '../../../../shared/interfaces/classrooms.model';
import { Auth } from '../../../auth/services/auth';
import { ClassroomList } from '../../../../shared/components/classroom-list/classroom-list';
import { FormsModule } from '@angular/forms';
import { UpcomingQuizzes } from '../../components/upcoming-quizzes/upcoming-quizzes';
import { QuizModel } from '../../interfaces/quiz.model';
import { StudentClassroomService } from '../../services/student-classroom-service';

/** A quiz as it appears in the cross-classroom "Results & History" list — the
 * classroom it belongs to is attached client-side while fetching, since the
 * per-classroom endpoint doesn't return it. */
interface QuizHistoryRow extends QuizModel {
  classroomTitle: string;
}

@Component({
  selector: 'app-student-dashboard',
  imports: [RouterLink, ClassroomList, FormsModule, UpcomingQuizzes],
  templateUrl: './student-dashboard.html',
  styleUrl: './student-dashboard.css',
})
export class StudentDashboard implements OnInit {

  constructor(public authService: Auth, private classroomService: StudentClassroomService, private router: Router) {
  }

  readonly classrooms = signal<ClassroomModel[]>([]);
  readonly classroomsLoading = signal(true);
  readonly classroomsError = signal('');

  /** Every published quiz across every enrolled classroom, regardless of due date —
   * unlike `classrooms()[].quizzes`, which the dashboard-list endpoint deliberately
   * limits to quizzes that haven't closed yet. Needed for accurate lifetime totals. */
  readonly quizHistory = signal<QuizHistoryRow[]>([]);
  readonly quizHistoryLoading = signal(true);

  readonly userName = computed(() => this.authService.getUserName() || 'Student');
  readonly userRole = computed(() => this.authService.getUserRole() || 'Student');
  readonly initials = computed(() => this.initialsFor(this.userName()));

  /** Still-open quizzes across every classroom — the dashboard-list endpoint already
   * excludes anything past its close date, so this doubles as "what's active right now". */
  readonly upcomingQuizzes = computed(() =>
    this.classrooms().flatMap(c => c.quizzes ?? [])
  );

  readonly pendingQuizzesCount = computed(
    () => this.upcomingQuizzes().filter(q => q.status !== 'Completed').length
  );

  readonly completedQuizzes = computed(
    () => this.quizHistory().filter(q => q.status === 'Completed')
  );

  readonly averageScore = computed(() => {
    const scored = this.completedQuizzes().filter(
      q => q.score != null && (q.totalPoints ?? 0) > 0
    );
    if (scored.length === 0) return 0;
    const total = scored.reduce((sum, q) => sum + (q.score! / q.totalPoints!) * 100, 0);
    return Math.round(total / scored.length);
  });

  /** Most recently completed quizzes, newest first — ids increase over time, same
   * recency proxy the instructor dashboard uses since submission dates aren't in the DTO. */
  readonly recentResults = computed(() =>
    [...this.completedQuizzes()].sort((a, b) => b.id - a.id).slice(0, 8)
  );

  classroomCode: string = '';

  joinMessage = signal('');
  joinError = signal('');
  joining = signal(false);

  ngOnInit() {
    this.loadClassrooms();
  }

  joinClassroom() {
    if (!this.classroomCode.trim() || this.joining()) {
      return;
    }

    this.joining.set(true);
    this.joinMessage.set('');
    this.joinError.set('');

    this.classroomService.joinClassroom({
      classCode: this.classroomCode.trim(),
      userId: this.authService.getUserId()
    }).subscribe({
      next: (response) => {
        this.joining.set(false);
        this.joinMessage.set(response?.message ?? 'Joined the classroom.');
        this.classroomCode = '';

        const classroom = response?.data as ClassroomModel | undefined;

        // A classroom that requires approval returns success, but the student is not
        // a member yet — adding it to the list here would show them a classroom they
        // cannot open.
        if (classroom && classroom.enrollmentStatus !== 'Pending') {
          this.classrooms.update(classrooms => [...classrooms, classroom]);
          this.loadQuizHistory(this.classrooms());
        }
      },
      error: (error) => {
        this.joining.set(false);
        const body = error?.error;
        this.joinError.set(
          typeof body === 'string' && body.trim()
            ? body
            : body?.message ?? 'Could not join that classroom. Check the code and try again.'
        );
      }
    })

  }

  loadClassrooms() {
    this.classroomsLoading.set(true);
    this.classroomsError.set('');

    this.classroomService.fetchAllClassrooms().subscribe({
      next: (data: ClassroomModel[]) => {
        this.classrooms.set(data ?? []);
        this.classroomsLoading.set(false);
        this.loadQuizHistory(data ?? []);
      },
      error: () => {
        this.classroomsLoading.set(false);
        this.quizHistoryLoading.set(false);
        this.classroomsError.set('Unable to load your classrooms.');
      }
    });
  }

  /** Sends the user back to the login screen the same way the global header's
   * logout button does — this sidebar link is just a second, always-visible path to it. */
  signOut(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private loadQuizHistory(classrooms: ClassroomModel[]): void {
    if (classrooms.length === 0) {
      this.quizHistory.set([]);
      this.quizHistoryLoading.set(false);
      return;
    }

    this.quizHistoryLoading.set(true);

    // No single "all my results" endpoint exists, so this fans out one request per
    // classroom (a student is typically in a handful) and merges the results — same
    // approach the instructor dashboard uses for its own cross-classroom quiz list.
    const requests = classrooms.map((classroom) =>
      this.classroomService.getClassroomById(classroom.id).pipe(
        map((response: any) =>
          ((response?.quizzes ?? []) as QuizModel[]).map((quiz) => ({
            ...quiz,
            classroomTitle: classroom.classroomTitle,
          }))
        ),
        catchError(() => of([] as QuizHistoryRow[]))
      )
    );

    forkJoin(requests).subscribe({
      next: (results) => {
        this.quizHistory.set(results.flat());
        this.quizHistoryLoading.set(false);
      },
      error: () => {
        this.quizHistoryLoading.set(false);
      },
    });
  }

  scoreLabel(quiz: QuizModel): string {
    if (quiz.score == null) {
      return 'Score unavailable';
    }
    return quiz.totalPoints ? `${quiz.score}/${quiz.totalPoints}` : `${quiz.score}`;
  }

  private initialsFor(name: string): string {
    const parts = name.split(/[,\s]+/).filter(Boolean);
    if (parts.length === 0) {
      return 'ST';
    }
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  }

}
