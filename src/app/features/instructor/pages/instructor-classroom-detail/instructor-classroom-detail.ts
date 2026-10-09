import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { InstructorClassroomService } from '../../services/instructor-classroom-service';
import { ClassroomModel } from '../../../../shared/interfaces/classrooms.model';
import { QuizModel } from '../../../student/interfaces/quiz.model';
import { StudentModel } from '../../../../shared/interfaces/student.model';
import { Announcement } from '../../../../shared/interfaces/announcement.model';
import { ClassroomDialog } from '../../components/classroom-dialog/classroom-dialog';
import { Auth } from '../../../auth/services/auth';
import { TimeAgoPipe } from '../../../../shared/pipes/time-ago.pipe';
import { PhilippineDatePipe } from '../../../../shared/pipes/philippine-date.pipe';
import { formatPhilippineDateTime, scheduleTimestamp } from '../../../../shared/utils/philippine-time';
import { QuizLeaderboard } from '../../interfaces/quiz-leaderboard.model';
import { QuizResultsAnalytics } from '../../components/quiz-results-analytics/quiz-results-analytics';
import { RosterImportDialog } from '../../components/roster-import-dialog/roster-import-dialog';
import { ClassroomRosterImport, PendingRosterEntry } from '../../interfaces/classroom-roster.model';

type TabKey = 'quizzes' | 'students' | 'announcements' | 'performance' | 'results' | 'settings';

/** A quiz paired with its client-computed completion percentage, for the Performance tab. */
interface PerformanceRow {
  quiz: QuizModel;
  completion: number;
}

@Component({
  selector: 'app-instructor-classroom-detail',
  imports: [CommonModule, FormsModule, RouterLink, RouterOutlet, TimeAgoPipe, PhilippineDatePipe, MatIconModule, QuizResultsAnalytics],
  templateUrl: './instructor-classroom-detail.html',
  styleUrl: './instructor-classroom-detail.css',
})
export class InstructorClassroomDetail implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly classroomService = inject(InstructorClassroomService);
  private readonly matDialog = inject(MatDialog);
  private readonly auth = inject(Auth);

  /** Read once — this page is always re-created when the :id param changes. */
  readonly classroomId = this.route.snapshot.paramMap.get('id') ?? '';

  private routerSub?: Subscription;
  private resultsSub?: Subscription;
  private quizzesLoaded = false;
  private studentsLoaded = false;
  private announcementsLoaded = false;

  readonly classroom = signal<ClassroomModel | null>(null);
  readonly classroomLoading = signal(true);
  readonly classroomError = signal('');

  readonly quizzes = signal<QuizModel[]>([]);
  readonly quizzesLoading = signal(false);

  readonly students = signal<StudentModel[]>([]);
  readonly studentsLoading = signal(false);
  readonly studentsError = signal('');
  readonly pendingRoster = signal<PendingRosterEntry[]>([]);
  readonly rosterLoading = signal(false);
  readonly rosterError = signal('');
  readonly cancellingRosterId = signal<string | null>(null);
  private rosterDialogOpen = false;

  /** Student.id currently being removed, so only that row shows "Removing…". */
  readonly removingStudentId = signal<string | null>(null);

  readonly announcements = signal<Announcement[]>([]);
  readonly announcementsLoading = signal(false);
  readonly newAnnouncementContent = signal('');
  readonly postingAnnouncement = signal(false);
  readonly announcementError = signal('');

  /** Which posted announcement's full read-receipt roster is expanded, if any. */
  readonly expandedAnnouncementId = signal<string | null>(null);

  /** Which quiz's leaderboard is showing on the Results tab. */
  readonly resultsQuizId = signal<number | null>(null);
  readonly leaderboard = signal<QuizLeaderboard | null>(null);
  readonly leaderboardLoading = signal(false);
  readonly leaderboardError = signal('');

  readonly copyMessage = signal('');

  /** Danger zone (Settings tab): leave/rejoin/delete. */
  readonly leavingClassroom = signal(false);
  readonly deletingClassroom = signal(false);
  readonly dangerZoneError = signal('');

  readonly activeTab = signal<TabKey>(this.initialTab());

  /** Whether a child route (requests / monitoring) is active — when it is, the outlet
   * takes over the page instead of the tabbed detail view below. */
  readonly hasChildRoute = signal(!!this.route.snapshot.firstChild);

  readonly userName = computed(() => this.auth.getUserName() || 'Instructor');
  readonly userRole = computed(() => this.auth.getUserRole() || 'Instructor');
  readonly initials = computed(() => this.initialsFor(this.userName()));

  readonly totalQuizzes = computed(() => this.quizzes().length);
  readonly publishedQuizzes = computed(() => this.quizzes().filter((q) => q.status === 'Published'));
  readonly draftQuizzes = computed(() => this.quizzes().filter((q) => q.status !== 'Published'));
  readonly publishedCount = computed(() => this.publishedQuizzes().length);

  /** Unweighted average of each published quiz's own average score. Quizzes with no
   * submissions yet are excluded so they don't drag a brand-new classroom's figure to 0. */
  readonly avgClassScore = computed(() => {
    const scored = this.publishedQuizzes().filter(
      (q) => (q.submissions ?? 0) > 0 && q.averageScore != null
    );
    if (scored.length === 0) return 0;
    return Math.round(scored.reduce((sum, q) => sum + (q.averageScore ?? 0), 0) / scored.length);
  });

  /** Average, across published quizzes, of submissions ÷ enrolled students. */
  readonly completionRate = computed(() => {
    const enrolled = this.classroom()?.numberOfStudents ?? 0;
    const published = this.publishedQuizzes();
    if (enrolled === 0 || published.length === 0) return 0;
    const rate =
      published.reduce((sum, q) => sum + Math.min((q.submissions ?? 0) / enrolled, 1), 0) /
      published.length;
    return Math.round(rate * 100);
  });

  readonly performanceRows = computed<PerformanceRow[]>(() => {
    const enrolled = this.classroom()?.numberOfStudents ?? 0;
    return this.publishedQuizzes().map((quiz) => ({
      quiz,
      completion: enrolled ? Math.round(Math.min((quiz.submissions ?? 0) / enrolled, 1) * 100) : 0,
    }));
  });

  /** Every published quiz, newest first — the pool the Results tab's quiz picker offers. */
  readonly resultsQuizOptions = computed(() =>
    [...this.publishedQuizzes()].sort((a, b) => b.id - a.id)
  );

  readonly podiumRows = computed(() => this.leaderboard()?.rows.slice(0, 3) ?? []);
  readonly remainingRows = computed(() => this.leaderboard()?.rows.slice(3) ?? []);

  ngOnInit(): void {
    this.loadClassroom();
    this.routerSub = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.hasChildRoute.set(!!this.route.snapshot.firstChild));
  }

  signOut(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.resultsSub?.unsubscribe();
  }

  selectTab(tab: TabKey): void {
    this.activeTab.set(tab);
    // Keep the tab in the URL (minus the default) so refresh / share links land on it.
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tab === 'quizzes' ? null : tab },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    this.loadTabData(tab);
  }

  openEditDialog(): void {
    const current = this.classroom();
    if (!current) return;

    const dialogRef = this.matDialog.open(ClassroomDialog, { data: current });
    dialogRef.afterClosed().subscribe((response: ClassroomModel | undefined) => {
      if (!response) return;
      this.classroom.update((c) => (c ? { ...c, ...response } : c));
    });
  }

  /** No dedicated "edit quiz" flow exists yet, so row/tab actions land on the AI
   * generator — the same best-effort target the dashboard's "Add Quiz" uses. */
  goToMonitoring(quizId?: number): void {
    this.router.navigate(['/instructor-classroom', this.classroomId, 'monitoring'], {
      queryParams: quizId ? { quizId } : {},
    });
  }

  copyClassCode(): void {
    const code = this.classroom()?.classCode;
    if (!code || !navigator.clipboard) return;

    navigator.clipboard.writeText(code).then(() => {
      this.copyMessage.set('Copied!');
      setTimeout(() => this.copyMessage.set(''), 2000);
    });
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

  private initialTab(): TabKey {
    const requested = this.route.snapshot.queryParamMap.get('tab');
    return requested === 'students' || requested === 'announcements'
        || requested === 'performance' || requested === 'results' || requested === 'settings'
      ? requested
      : 'quizzes';
  }

  private loadClassroom(): void {
    if (!this.classroomId) {
      this.classroomLoading.set(false);
      this.classroomError.set('Classroom not found.');
      return;
    }

    this.classroomLoading.set(true);
    this.classroomService.getClassroom(this.classroomId).subscribe({
      next: (classroom) => {
        this.classroom.set(classroom);
        this.classroomLoading.set(false);
        this.loadTabData(this.activeTab());
      },
      error: () => {
        this.classroomLoading.set(false);
        this.classroomError.set('Unable to load this classroom.');
      },
    });
  }

  private loadTabData(tab: TabKey): void {
    if ((tab === 'quizzes' || tab === 'performance' || tab === 'results') && !this.quizzesLoaded) {
      this.loadQuizzes();
    }
    if (tab === 'students' && !this.studentsLoaded) {
      this.loadStudents();
    }
    if (tab === 'announcements' && !this.announcementsLoaded) {
      this.loadAnnouncements();
    }
    if (tab === 'results') {
      this.ensureResultsQuizSelected();
    }
  }

  private loadQuizzes(): void {
    this.quizzesLoaded = true;
    this.quizzesLoading.set(true);
    this.classroomService.getQuizzes(this.classroomId).subscribe({
      next: (quizzes) => {
        this.quizzes.set(quizzes ?? []);
        this.quizzesLoading.set(false);
        this.ensureResultsQuizSelected();
      },
      error: () => {
        this.quizzesLoading.set(false);
      },
    });
  }

  /** Defaults the Results tab's quiz picker to the most recent published quiz, if
   * nothing's been explicitly picked yet (either by the user or via viewResults()). */
  private ensureResultsQuizSelected(): void {
    if (this.resultsQuizId() != null) {
      return;
    }
    const first = this.resultsQuizOptions()[0];
    if (first) {
      this.selectResultsQuiz(first.id);
    }
  }

  selectResultsQuiz(quizId: number): void {
    this.resultsQuizId.set(quizId);
    this.loadLeaderboard(quizId);
  }

  /** Entry point from the Quizzes tab's "Results" row action — jumps straight to this
   * quiz's leaderboard instead of the generic default. */
  viewResults(quizId: number): void {
    this.resultsQuizId.set(quizId);
    this.selectTab('results');
    this.loadLeaderboard(quizId);
  }

  private loadLeaderboard(quizId: number): void {
    this.resultsSub?.unsubscribe();
    this.leaderboard.set(null);
    this.leaderboardLoading.set(true);
    this.leaderboardError.set('');
    this.resultsSub = this.classroomService.getQuizLeaderboard(quizId).subscribe({
      next: (data) => {
        this.leaderboard.set(data);
        this.leaderboardLoading.set(false);
      },
      error: (error) => {
        this.leaderboardLoading.set(false);
        const body = (error as { error?: unknown })?.error;
        const message = (body as { message?: string })?.message;
        this.leaderboardError.set(message?.trim() || 'Unable to load results for this quiz.');
      },
    });
  }

  refreshResults(): void {
    const quizId = this.resultsQuizId();
    if (quizId != null) this.loadLeaderboard(quizId);
  }

  formatTimeTaken(seconds: number | null): string {
    if (seconds == null || seconds < 0) {
      return '—';
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
  }

  downloadResultsCsv(): void {
    const data = this.leaderboard();
    if (!data || data.rows.length === 0) {
      return;
    }

    const header = ['Rank', 'Student', 'Student ID', 'Section', 'Score', 'Percentage', 'vs Average', 'Passed', 'Time Taken', 'Submitted'];
    const lines = data.rows.map((row) => [
      String(row.rank),
      row.fullName,
      row.studentNumber,
      row.section,
      `${row.score}/${row.totalPoints}`,
      `${row.percentage}%`,
      `${row.deltaFromAverage > 0 ? '+' : ''}${row.deltaFromAverage}%`,
      row.passed ? 'Yes' : 'No',
      this.formatTimeTaken(row.timeTakenSeconds),
      formatPhilippineDateTime(row.submittedAt),
    ]);

    const csv = [header, ...lines]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${data.quizTitle.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-results.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private loadStudents(): void {
    this.loadPendingRoster();
    this.studentsLoaded = true;
    this.studentsLoading.set(true);
    this.studentsError.set('');
    this.classroomService.getStudentList(this.classroomId).subscribe({
      next: (students) => {
        this.students.set(students ?? []);
        this.studentsLoading.set(false);
      },
      error: () => {
        this.studentsLoading.set(false);
        this.studentsError.set('Unable to load students. Please refresh the list.');
      },
    });
  }

  refreshStudents(): void {
    this.loadStudents();
    this.classroomService.getClassroom(this.classroomId).subscribe({
      next: (classroom) => this.classroom.set(classroom),
      error: () => this.studentsError.set('Unable to refresh the enrolled count. Please try again.'),
    });
  }

  openRosterImport(): void {
    const classroom = this.classroom();
    if (!classroom || this.rosterDialogOpen) return;
    this.rosterDialogOpen = true;
    this.matDialog.open(RosterImportDialog, {
      width: '760px', maxWidth: 'calc(100vw - 24px)', maxHeight: 'calc(100dvh - 24px)',
      autoFocus: '#roster-file',
      data: { classroomId: this.classroomId, classroomTitle: classroom.classroomTitle },
    }).afterClosed().subscribe((report: ClassroomRosterImport | null) => {
      this.rosterDialogOpen = false;
      if (report?.imported) {
        this.classroom.update((current) => current ? { ...current, numberOfStudents: report.numberOfStudents, pendingRequestCount: report.pendingRequestCount } : current);
        this.loadStudents();
      } else this.refreshStudents();
    });
  }

  private loadPendingRoster(): void {
    this.rosterLoading.set(true);
    this.rosterError.set('');
    this.classroomService.getPendingRoster(this.classroomId).subscribe({
      next: (entries) => { this.pendingRoster.set(entries); this.rosterLoading.set(false); },
      error: () => { this.rosterLoading.set(false); this.rosterError.set('Unable to load IDs awaiting registration.'); },
    });
  }

  cancelRosterEntry(entry: PendingRosterEntry): void {
    if (this.cancellingRosterId() || !confirm(`Cancel automatic enrollment for student ID ${entry.studentNumber}?`)) return;
    this.cancellingRosterId.set(entry.studentNumber);
    this.classroomService.cancelRosterEntry(this.classroomId, entry.studentNumber).subscribe({
      next: () => { this.cancellingRosterId.set(null); this.loadPendingRoster(); },
      error: () => { this.cancellingRosterId.set(null); this.rosterError.set('Unable to cancel this ID. Refresh the list and try again.'); },
    });
  }

  private loadAnnouncements(): void {
    this.announcementsLoaded = true;
    this.announcementsLoading.set(true);
    this.classroomService.getAnnouncements(this.classroomId).subscribe({
      next: (announcements) => {
        this.announcements.set(announcements ?? []);
        this.announcementsLoading.set(false);
      },
      error: () => {
        this.announcementsLoading.set(false);
      },
    });
  }

  postAnnouncement(): void {
    if (this.postingAnnouncement()) {
      return;
    }

    if (!this.newAnnouncementContent().trim()) {
      this.announcementError.set('Announcement content is required.');
      return;
    }

    this.postingAnnouncement.set(true);
    this.announcementError.set('');

    this.classroomService
      .postAnnouncement(this.classroomId, {
        content: this.newAnnouncementContent().trim(),
      })
      .subscribe({
        next: (announcement) => {
          this.postingAnnouncement.set(false);
          this.newAnnouncementContent.set('');
          this.announcements.update((list) => [announcement, ...list]);
        },
        error: (error) => {
          this.postingAnnouncement.set(false);
          const body = (error as { error?: unknown })?.error;
          const message = (body as { message?: string })?.message;
          this.announcementError.set(message?.trim() || 'Unable to post this announcement.');
        },
      });
  }

  removeStudent(student: StudentModel): void {
    if (this.removingStudentId()) {
      return;
    }

    const fullName = `${student.firstName} ${student.lastName}`.trim();
    const confirmed = confirm(
      `Remove ${fullName} from this classroom? They will need to rejoin with the class code, and any quizzes already in progress will be lost.`
    );
    if (!confirmed) {
      return;
    }

    this.removingStudentId.set(student.id);
    this.studentsError.set('');

    this.classroomService.removeStudent(this.classroomId, student.id).subscribe({
      next: () => {
        this.removingStudentId.set(null);
        this.students.update((list) => list.filter((s) => s.id !== student.id));
        this.classroom.update((c) =>
          c ? { ...c, numberOfStudents: Math.max(0, (c.numberOfStudents ?? 1) - 1) } : c
        );
      },
      error: (error) => {
        this.removingStudentId.set(null);
        const body = (error as { error?: unknown })?.error;
        const message = (body as { message?: string })?.message;
        this.studentsError.set(message?.trim() || `Unable to remove ${fullName}.`);
      },
    });
  }

  // ---- Danger zone (Settings tab) ----

  /** Hides the classroom from the dashboard without touching any data — reversible
   * via rejoinClassroom(). Navigates back to the dashboard since it's no longer listed there. */
  leaveClassroom(): void {
    if (this.leavingClassroom() || this.deletingClassroom()) {
      return;
    }

    const title = this.classroom()?.classroomTitle ?? 'this classroom';
    const confirmed = confirm(
      `Leave "${title}"? It'll be hidden from your dashboard, but nothing is deleted — your students keep full access, and you can rejoin any time from this page's direct link.`
    );
    if (!confirmed) {
      return;
    }

    this.leavingClassroom.set(true);
    this.dangerZoneError.set('');

    this.classroomService.archiveClassroom(this.classroomId).subscribe({
      next: () => {
        this.leavingClassroom.set(false);
        this.router.navigate(['/instructor-dashboard']);
      },
      error: (error) => {
        this.leavingClassroom.set(false);
        const body = (error as { error?: unknown })?.error;
        const message = (body as { message?: string })?.message;
        this.dangerZoneError.set(message?.trim() || 'Unable to leave this classroom.');
      },
    });
  }

  /** Undoes leaveClassroom() — only shown once the classroom is already archived. */
  rejoinClassroom(): void {
    if (this.leavingClassroom() || this.deletingClassroom()) {
      return;
    }

    this.leavingClassroom.set(true);
    this.dangerZoneError.set('');

    this.classroomService.unarchiveClassroom(this.classroomId).subscribe({
      next: () => {
        this.leavingClassroom.set(false);
        this.classroom.update((c) => (c ? { ...c, isArchived: false } : c));
      },
      error: (error) => {
        this.leavingClassroom.set(false);
        const body = (error as { error?: unknown })?.error;
        const message = (body as { message?: string })?.message;
        this.dangerZoneError.set(message?.trim() || 'Unable to rejoin this classroom.');
      },
    });
  }

  /** Permanent soft-delete — every quiz, student, and result becomes inaccessible. */
  deleteClassroom(): void {
    if (this.leavingClassroom() || this.deletingClassroom()) {
      return;
    }

    const title = this.classroom()?.classroomTitle ?? 'this classroom';
    const confirmed = confirm(
      `Delete "${title}"? This cannot be undone from here — every quiz, student roster entry, announcement, and result in this classroom becomes inaccessible.`
    );
    if (!confirmed) {
      return;
    }

    this.deletingClassroom.set(true);
    this.dangerZoneError.set('');

    this.classroomService.deleteClassroom(this.classroomId).subscribe({
      next: () => {
        this.deletingClassroom.set(false);
        this.router.navigate(['/instructor-dashboard']);
      },
      error: (error) => {
        this.deletingClassroom.set(false);
        const body = (error as { error?: unknown })?.error;
        const message = (body as { message?: string })?.message;
        this.dangerZoneError.set(message?.trim() || 'Unable to delete this classroom.');
      },
    });
  }

  toggleAcknowledgers(announcementId: string): void {
    this.expandedAnnouncementId.update((current) => (current === announcementId ? null : announcementId));
  }

  initialsFor(name: string): string {
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
