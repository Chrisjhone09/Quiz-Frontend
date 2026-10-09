import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { InstructorClassroomService } from '../../services/instructor-classroom-service';
import { EnrollmentQueue, EnrollmentRequest } from '../../interfaces/enrollment.model';
import { TimeAgoPipe } from '../../../../shared/pipes/time-ago.pipe';

type TabKey = 'pending' | 'decided';

@Component({
  selector: 'app-enrollment-requests',
  imports: [CommonModule, TimeAgoPipe],
  templateUrl: './enrollment-requests.html',
  styleUrl: './enrollment-requests.css',
})
export class EnrollmentRequests implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly classroomService = inject(InstructorClassroomService);
  private classroomId: string | null | undefined;

  readonly queue = signal<EnrollmentQueue | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly actionMessage = signal('');
  readonly activeTab = signal<TabKey>('pending');

  /** studentId currently being decided, so only that row is disabled. */
  readonly busyStudentId = signal<string | null>(null);

  readonly pending = computed(() => this.queue()?.pending ?? []);
  readonly decided = computed(() => this.queue()?.decided ?? []);
  readonly requiresApproval = computed(() => this.queue()?.requiresApproval ?? false);

  ngOnInit(): void {
    this.classroomId = this.route.parent?.snapshot.paramMap.get('id');
    this.load();
  }

  setTab(tab: TabKey): void {
    this.activeTab.set(tab);
  }

  refresh(): void {
    this.actionMessage.set('');
    this.load();
  }

  approve(request: EnrollmentRequest): void {
    this.decide(request, 'approve');
  }

  reject(request: EnrollmentRequest): void {
    this.decide(request, 'reject');
  }

  isBusy(request: EnrollmentRequest): boolean {
    return this.busyStudentId() === request.studentId;
  }

  initials(request: EnrollmentRequest): string {
    return request.fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }

  statusClass(status: string): string {
    return `status status-${status.toLowerCase()}`;
  }

  private decide(request: EnrollmentRequest, action: 'approve' | 'reject'): void {
    if (this.busyStudentId() || !this.classroomId) {
      return;
    }

    this.busyStudentId.set(request.studentId);
    this.actionMessage.set('');

    const payload = { classroomId: this.classroomId, studentId: request.studentId };
    const call =
      action === 'approve'
        ? this.classroomService.approveEnrollment(payload)
        : this.classroomService.rejectEnrollment(payload);

    call.subscribe({
      next: () => {
        this.actionMessage.set(
          action === 'approve'
            ? `${request.fullName} has been added to the classroom.`
            : `${request.fullName}'s request was rejected.`
        );
        this.busyStudentId.set(null);
        this.load(false);
      },
      error: (error) => {
        this.busyStudentId.set(null);
        const body = error?.error;
        this.actionMessage.set(
          typeof body === 'string' && body.trim()
            ? body
            : `Unable to ${action} this request right now.`
        );
      },
    });
  }

  private load(showLoading = true): void {
    if (!this.classroomId) {
      this.loading.set(false);
      this.errorMessage.set('Classroom not found.');
      return;
    }

    if (showLoading) {
      this.loading.set(true);
    }

    this.classroomService.getEnrollmentRequests(this.classroomId).subscribe({
      next: (queue) => {
        this.queue.set(queue);
        this.errorMessage.set('');
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(
          error?.status === 401 || error?.status === 403
            ? 'You do not have permission to manage this classroom.'
            : 'Unable to load enrolment requests.'
        );
      },
    });
  }
}
