import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { InstructorClassroomService } from '../../services/instructor-classroom-service';
import {
  MonitoringDashboard,
  MonitoringLog,
  MonitoringStudent,
} from '../../interfaces/monitoring.model';
import { QuizMonitoringRealtimeService } from '../../../../shared/services/quiz-monitoring-realtime.service';
import { TimeAgoPipe } from '../../../../shared/pipes/time-ago.pipe';
import { PhilippineDatePipe } from '../../../../shared/pipes/philippine-date.pipe';
import { ForceSubmitDialog } from './force-submit-dialog';

@Component({
  selector: 'app-monitoring',
  imports: [CommonModule, FormsModule, MatIconModule, MatTooltipModule, TimeAgoPipe, PhilippineDatePipe],
  templateUrl: './monitoring.html',
  styleUrl: './monitoring.css',
})
export class Monitoring implements OnInit, OnDestroy {
  private classroomId: string | null | undefined;
  private realtimeSubscription?: Subscription;
  private monitoringRequest?: Subscription;
  private forceDialogOpen = false;

  readonly dashboard = signal<MonitoringDashboard | null>(null);
  readonly selectedQuizId = signal<number | null>(null);
  readonly loading = signal(true);
  readonly actionMessage = signal('');
  readonly expandedScoreStudentId = signal<string | null>(null);
  readonly search = signal('');
  readonly statusFilter = signal('all');
  readonly alertsOnly = signal(false);
  readonly actionError = signal(false);
  readonly pendingActions = signal<Set<string>>(new Set());
  readonly connectionAvailable = signal(false);

  readonly students = computed(() => this.dashboard()?.students ?? []);
  readonly eventFeed = computed(() => this.dashboard()?.eventFeed ?? []);
  readonly filteredStudents = computed(() => {
    const query = this.search().trim().toLowerCase();
    return this.students().filter((student) =>
      (this.statusFilter() === 'all' || student.status === this.statusFilter()) &&
      (!this.alertsOnly() || student.tabSwitchCount > 0) &&
      (!query || `${student.fullName} ${student.studentNumber} ${student.section}`.toLowerCase().includes(query))
    );
  });
  readonly takingCount = computed(() => this.students().filter((student) => student.status === 'Taking').length);
  readonly submittedCount = computed(() => this.students().filter((student) => student.status === 'Submitted').length);
  readonly alertCount = computed(() =>
    this.students().reduce((total, student) => total + student.tabSwitchCount, 0)
  );
  readonly completionPercentage = computed(() => {
    const total = this.students().length;
    return total === 0 ? 0 : Math.round((this.submittedCount() / total) * 100);
  });

  constructor(
    private route: ActivatedRoute,
    private classroomService: InstructorClassroomService,
    public realtime: QuizMonitoringRealtimeService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.classroomId = this.route.parent?.snapshot.paramMap.get('id');

    // Row actions on the classroom-detail page ("Results" / "Monitor") deep-link here
    // with ?quizId=<id> so the dashboard opens straight to the right quiz.
    const requestedQuizId = Number(this.route.snapshot.queryParamMap.get('quizId'));
    if (requestedQuizId) {
      this.selectedQuizId.set(requestedQuizId);
    }

    this.loadMonitoring();

    this.realtimeSubscription = this.realtime.monitoringEvent$.subscribe((event) => {
      if (event.quizId === this.selectedQuizId()) {
        this.loadMonitoring(event.quizId, false);
      }
    });
  }

  ngOnDestroy(): void {
    this.realtimeSubscription?.unsubscribe();
    this.monitoringRequest?.unsubscribe();
  }

  onQuizChange(quizId: string): void {
    const parsedQuizId = Number(quizId);
    this.selectedQuizId.set(parsedQuizId);
    this.expandedScoreStudentId.set(null);
    this.actionMessage.set('');
    this.connectionAvailable.set(false);
    this.loadMonitoring(parsedQuizId);
  }

  refresh(): void {
    this.loadMonitoring();
  }

  isPending(student: MonitoringStudent): boolean {
    return this.pendingActions().has(`${this.selectedQuizId()}:${student.studentId}`);
  }

  private setPending(key: string, pending: boolean): void {
    this.pendingActions.update((current) => {
      const next = new Set(current);
      pending ? next.add(key) : next.delete(key);
      return next;
    });
  }

  warn(student: MonitoringStudent): void {
    const quizId = this.selectedQuizId();
    if (!quizId || student.status !== 'Taking' || this.isPending(student)) {
      return;
    }

    const key = `${quizId}:${student.studentId}`;
    this.setPending(key, true);

    this.classroomService
      .warnStudent({
        studentId: student.studentId,
        quizId,
        message: 'Please stay on the quiz tab. Tab switching is being recorded.',
      })
      .subscribe({
        next: () => {
          this.setPending(key, false);
          this.actionError.set(false);
          this.actionMessage.set(`Warning sent to ${student.fullName}.`);
          if (quizId === this.selectedQuizId()) this.loadMonitoring(quizId, false);
        },
        error: () => {
          this.setPending(key, false);
          this.actionError.set(true);
          this.actionMessage.set('Unable to send warning right now.');
        },
      });
  }

  forceSubmit(student: MonitoringStudent): void {
    const quizId = this.selectedQuizId();
    if (!quizId || student.status !== 'Taking' || this.isPending(student) || this.forceDialogOpen) {
      return;
    }

    this.forceDialogOpen = true;
    this.dialog.open(ForceSubmitDialog, {
      width: '440px', maxWidth: 'calc(100vw - 32px)',
      autoFocus: '#cancel-force-submit', data: student.fullName,
    }).afterClosed().subscribe((confirmed) => {
      this.forceDialogOpen = false;
      if (confirmed === true && quizId === this.selectedQuizId()) this.submitAttempt(student, quizId);
    });
  }

  private submitAttempt(student: MonitoringStudent, quizId: number): void {
    const current = this.students().find((item) => item.studentId === student.studentId);
    if (current?.status !== 'Taking' || this.isPending(current)) return;
    const key = `${quizId}:${student.studentId}`;
    this.setPending(key, true);

    this.classroomService
      .forceSubmit({
        studentId: student.studentId,
        quizId,
      })
      .subscribe({
        next: () => {
          this.setPending(key, false);
          this.actionError.set(false);
          this.actionMessage.set(`Force submit sent to ${student.fullName}.`);
          if (quizId === this.selectedQuizId()) this.loadMonitoring(quizId, false);
        },
        error: () => {
          this.setPending(key, false);
          this.actionError.set(true);
          this.actionMessage.set('Unable to force submit right now.');
        },
      });
  }

  toggleScore(student: MonitoringStudent): void {
    this.expandedScoreStudentId.update((current) =>
      current === student.studentId ? null : student.studentId
    );
  }

  initials(student: MonitoringStudent): string {
    return student.fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }

  isTabSwitch(log: MonitoringLog): boolean {
    return log.action.toLowerCase().includes('tab') && log.action.toLowerCase().includes('switch');
  }

  private loadMonitoring(quizId: number | null = this.selectedQuizId(), showLoading = true): void {
    if (!this.classroomId) {
      this.loading.set(false);
      return;
    }

    if (showLoading) {
      this.loading.set(true);
    }

    this.monitoringRequest?.unsubscribe();
    this.monitoringRequest = this.classroomService.getMonitoring(this.classroomId, quizId).subscribe({
      next: async (dashboard) => {
        this.dashboard.set(dashboard);
        const nextQuizId = dashboard.selectedQuizId ?? dashboard.quizzes[0]?.id ?? null;
        this.selectedQuizId.set(nextQuizId);
        this.loading.set(false);

        if (nextQuizId) {
          try {
            await this.realtime.joinQuizMonitoring(nextQuizId);
            if (nextQuizId === this.selectedQuizId()) this.connectionAvailable.set(true);
          } catch {
            if (nextQuizId === this.selectedQuizId()) this.connectionAvailable.set(false);
          }
        }
      },
      error: () => {
        this.loading.set(false);
        this.actionError.set(true);
        this.actionMessage.set('Unable to load monitoring data.');
      },
    });
  }
}
