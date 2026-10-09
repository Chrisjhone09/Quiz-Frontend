import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { InstructorClassroomService } from '../../services/instructor-classroom-service';
import { ClassroomModel } from '../../../../shared/interfaces/classrooms.model';
import { QuizModel } from '../../../student/interfaces/quiz.model';
import { ClassroomDialog } from '../../components/classroom-dialog/classroom-dialog';
import { Auth } from '../../../auth/services/auth';
import { TimeAgoPipe } from '../../../../shared/pipes/time-ago.pipe';
import { scheduleTimestamp } from '../../../../shared/utils/philippine-time';

/** A quiz as it appears in the cross-classroom activity table — the classroom it belongs to
 * is attached client-side while fetching, since the quiz list endpoint is per-classroom. */
interface QuizActivityRow extends QuizModel {
  classroomId: string;
}

@Component({
  selector: 'app-instructor-dashboard',
  imports: [CommonModule, RouterLink, TimeAgoPipe],
  templateUrl: './instructor-dashboard.html',
  styleUrl: './instructor-dashboard.css',
})
export class InstructorDashboard implements OnInit {
  private readonly classroomService = inject(InstructorClassroomService);
  private readonly matDialog = inject(MatDialog);
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  readonly classrooms = signal<ClassroomModel[]>([]);
  readonly classroomsLoading = signal(true);
  readonly classroomsError = signal('');

  readonly quizActivity = signal<QuizActivityRow[]>([]);
  readonly quizActivityLoading = signal(true);

  readonly activeClassroomCount = computed(() => this.classrooms().length);

  readonly totalStudents = computed(() =>
    this.classrooms().reduce((sum, c) => sum + (c.numberOfStudents ?? 0), 0)
  );

  readonly pendingReviewCount = computed(() =>
    this.classrooms().reduce((sum, c) => sum + (c.pendingRequestCount ?? 0), 0)
  );

  readonly quizzesPublishedCount = computed(
    () => this.quizActivity().filter((q) => q.status === 'Published').length
  );

  /** Most recently created quizzes across every classroom, newest first. */
  readonly recentQuizActivity = computed(() =>
    [...this.quizActivity()].sort((a, b) => b.id - a.id).slice(0, 8)
  );

  readonly userName = computed(() => this.auth.getUserName() || 'Instructor');
  readonly userRole = computed(() => this.auth.getUserRole() || 'Instructor');
  readonly initials = computed(() => this.initialsFor(this.userName()));

  ngOnInit(): void {
    this.loadClassrooms();
  }

  signOut(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  loadClassrooms(): void {
    this.classroomsLoading.set(true);
    this.classroomsError.set('');

    this.classroomService.getClassrooms().subscribe({
      next: (classrooms) => {
        this.classrooms.set(classrooms ?? []);
        this.classroomsLoading.set(false);
        this.loadQuizActivity(classrooms ?? []);
      },
      error: () => {
        this.classroomsLoading.set(false);
        this.quizActivityLoading.set(false);
        this.classroomsError.set('Unable to load your classrooms.');
      },
    });
  }

  private loadQuizActivity(classrooms: ClassroomModel[]): void {
    if (classrooms.length === 0) {
      this.quizActivity.set([]);
      this.quizActivityLoading.set(false);
      return;
    }

    this.quizActivityLoading.set(true);

    // No single "all my quizzes" endpoint exists, so this fans out one request per
    // classroom (instructors typically have a handful) and merges the results.
    const requests = classrooms.map((classroom) =>
      this.classroomService.getQuizzes(classroom.id).pipe(
        map((quizzes) =>
          (quizzes ?? []).map((quiz) => ({
            ...quiz,
            classroomTitle: classroom.classroomTitle,
            classroomId: classroom.id,
          }))
        ),
        catchError(() => of([] as QuizActivityRow[]))
      )
    );

    forkJoin(requests).subscribe({
      next: (results) => {
        this.quizActivity.set(results.flat());
        this.quizActivityLoading.set(false);
      },
      error: () => {
        this.quizActivityLoading.set(false);
      },
    });
  }

  openCreateDialog(): void {
    const dialogRef = this.matDialog.open(ClassroomDialog);

    dialogRef.afterClosed().subscribe((response: ClassroomModel | undefined) => {
      if (!response) {
        return;
      }
      this.classrooms.update((current) => [...current, response]);
      this.loadQuizActivity(this.classrooms());
    });
  }

  openEditDialog(classroom: ClassroomModel): void {
    const dialogRef = this.matDialog.open(ClassroomDialog, { data: classroom });

    dialogRef.afterClosed().subscribe((response: ClassroomModel | undefined) => {
      if (!response) {
        return;
      }
      this.classrooms.update((current) =>
        current.map((c) => (c.id === classroom.id ? { ...c, ...response } : c))
      );
    });
  }

  /** There's no cross-classroom monitoring view yet, so this lands on the first
   * classroom's monitoring tab — still real monitoring, just not merged into one screen. */
  goToMonitoring(): void {
    const first = this.classrooms()[0];
    if (!first) {
      return;
    }
    this.router.navigate(['/instructor-classroom', first.id, 'monitoring']);
  }

  studentsIn(classroomId: string): number {
    return this.classrooms().find((c) => c.id === classroomId)?.numberOfStudents ?? 0;
  }

  cardAccent(index: number): string {
    return `accent-${index % 4}`;
  }

  quizStatusLabel(quiz: QuizModel): string {
    if (quiz.status !== 'Published') {
      return 'Draft';
    }

    if (quiz.closeDate) {
      const close = scheduleTimestamp(quiz.closeDate, quiz.closeTime || '23:59:59');
      if (close && close.getTime() < Date.now()) {
        return 'Completed';
      }
    }

    return 'Active';
  }

  quizStatusClass(quiz: QuizModel): string {
    return `status-pill status-${this.quizStatusLabel(quiz).toLowerCase()}`;
  }

  downloadReportsCsv(): void {
    const rows = this.recentQuizActivity();
    if (rows.length === 0) {
      return;
    }

    const header = ['Quiz', 'Classroom', 'Published', 'Submissions', 'Enrolled', 'Average score', 'Status'];
    const lines = rows.map((quiz) => [
      quiz.quizTitle,
      quiz.classroomTitle ?? '',
      quiz.publishDate ?? '',
      String(quiz.submissions ?? 0),
      String(this.studentsIn(quiz.classroomId)),
      quiz.averageScore != null ? `${Math.round(quiz.averageScore)}%` : '',
      this.quizStatusLabel(quiz),
    ]);

    const csv = [header, ...lines]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'quiz-activity-report.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  private initialsFor(name: string): string {
    const parts = name.split(/[,\s]+/).filter(Boolean);
    if (parts.length === 0) {
      return 'IN';
    }
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    // Display name arrives as "Last, First" — read the initials back in First-Last order.
    return ((parts[1]?.[0] ?? '') + (parts[0]?.[0] ?? '')).toUpperCase();
  }
}
