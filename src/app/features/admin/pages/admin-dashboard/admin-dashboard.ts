import { CommonModule } from '@angular/common';
import { TimeAgoPipe } from '../../../../shared/pipes/time-ago.pipe';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Auth } from '../../../auth/services/auth';
import { AdminActivityHubService } from '../../services/admin-activity-hub.service';
import { AdminService } from '../../services/admin-service';
import {
  AccountQueue,
  AccountRequest,
  ActivityFeed,
  ActivityLogEntry,
  AdminReport,
  ClassroomAdmin,
  DeletedClassroomAdmin,
  InstructorAdmin,
  MANAGED_ROLES,
  StudentAdmin,
} from '../../interfaces/admin.model';

/** Top-level sections. 'pending' and 'decided' are sub-tabs of Approvals. */
type SectionKey =
  | 'overview'
  | 'approvals'
  | 'instructors'
  | 'students'
  | 'classrooms'
  | 'deletedClassrooms'
  | 'reports'
  | 'activity';
type TabKey = 'pending' | 'decided';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, FormsModule, TimeAgoPipe],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard implements OnInit, OnDestroy {
  private readonly adminService = inject(AdminService);
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly activityHub = inject(AdminActivityHubService);
  private activityHubSubscription?: Subscription;

  readonly queue = signal<AccountQueue | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly actionMessage = signal('');
  readonly activeTab = signal<TabKey>('pending');
  readonly activeSection = signal<SectionKey>('overview');

  readonly report = signal<AdminReport | null>(null);
  readonly reportLoading = signal(false);

  readonly activity = signal<ActivityFeed | null>(null);
  readonly activityLoading = signal(false);
  readonly activityCategory = signal<string | null>(null);
  readonly activityPage = signal(1);

  /** userId currently being approved/rejected, so we can disable just that row. */
  readonly busyUserId = signal<string | null>(null);

  /** userId whose reject form is open, and the reason being typed. */
  readonly rejectingUserId = signal<string | null>(null);
  readonly rejectReason = signal('');

  // ---- Instructors ----

  readonly instructors = signal<InstructorAdmin[] | null>(null);
  readonly instructorsLoading = signal(false);

  readonly showCreateInstructorForm = signal(false);
  readonly newInstructorFirstName = signal('');
  readonly newInstructorMiddleName = signal('');
  readonly newInstructorLastName = signal('');
  readonly newInstructorEmail = signal('');
  readonly newInstructorPassword = signal('');
  readonly creatingInstructor = signal(false);
  readonly createInstructorError = signal('');

  signOut(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  readonly editingInstructorId = signal<string | null>(null);
  readonly editInstructorFirstName = signal('');
  readonly editInstructorMiddleName = signal('');
  readonly editInstructorLastName = signal('');
  readonly editInstructorEmail = signal('');
  readonly savingInstructor = signal(false);
  readonly editInstructorError = signal('');

  // ---- Students ----

  readonly students = signal<StudentAdmin[] | null>(null);
  readonly studentsLoading = signal(false);

  readonly editingStudentId = signal<string | null>(null);
  readonly editStudentFirstName = signal('');
  readonly editStudentMiddleName = signal('');
  readonly editStudentLastName = signal('');
  readonly editStudentEmail = signal('');
  readonly editStudentNumber = signal('');
  readonly editStudentSection = signal('');
  readonly savingStudent = signal(false);
  readonly editStudentError = signal('');

  // ---- Shared account deletion ----

  readonly confirmingDeleteUserId = signal<string | null>(null);
  readonly deletingUserId = signal<string | null>(null);

  // ---- Shared role management ----
  // Roles are managed the same way for Instructor and Student rows alike, so
  // one set of editor state covers both lists.

  readonly managedRoles = MANAGED_ROLES;

  readonly editingRolesUserId = signal<string | null>(null);
  readonly editRolesSelected = signal<string[]>([]);
  /** Roles the account held when the editor opened — used to tell "granting Student
   * for the first time" (needs an ID + section) apart from "already a student". */
  readonly editRolesOriginal = signal<string[]>([]);
  readonly editRolesStudentIdInput = signal('');
  readonly editRolesSectionInput = signal('');
  readonly savingRoles = signal(false);
  readonly editRolesError = signal('');

  // ---- Classrooms (read-only) ----

  readonly classroomsAdmin = signal<ClassroomAdmin[] | null>(null);
  readonly classroomsLoading = signal(false);

  // ---- Deleted classrooms (recoverable) ----

  readonly deletedClassroomsAdmin = signal<DeletedClassroomAdmin[] | null>(null);
  readonly deletedClassroomsLoading = signal(false);
  readonly restoringClassroomId = signal<string | null>(null);

  readonly activityEntries = computed(() => this.activity()?.entries ?? []);
  readonly activityCategories = computed(() => this.activity()?.categories ?? []);
  readonly activityTotalPages = computed(() => {
    const feed = this.activity();
    return feed ? Math.max(1, Math.ceil(feed.totalCount / feed.pageSize)) : 1;
  });

  readonly pending = computed(() => this.queue()?.pending ?? []);
  readonly decided = computed(() => this.queue()?.decided ?? []);
  readonly stats = computed(() => this.queue()?.stats ?? null);

  // ---- Overview (landing page) ----------------------------------------------

  /** First few pending approvals, for the Overview page's preview list. */
  readonly recentPending = computed(() => this.pending().slice(0, 5));

  /**
   * The Overview page's "System Activity" panel — always exactly the 5 most
   * recent entries, kept live via SignalR (see AdminActivityHubService) rather
   * than requiring a manual refresh. Seeded once from the first activity-feed
   * fetch, then new entries are pushed onto the front as they happen.
   */
  readonly liveActivity = signal<ActivityLogEntry[]>([]);

  ngOnInit(): void {
    if (this.auth.getUserRole() !== 'Admin') {
      this.router.navigate(['/login']);
      return;
    }

    this.load();

    // The Overview page is the landing section, so its data (report totals +
    // recent activity) needs to be ready without waiting for the user to visit
    // the Reports/Activity tabs first.
    this.loadReports();
    this.loadActivity();

    this.activityHubSubscription = this.activityHub.activityLogged$.subscribe((entry) => {
      this.liveActivity.update((list) => [entry, ...list].slice(0, 5));

      // Keep the full Activity Log table's category filter chips and (when the
      // admin is looking at the first, unfiltered page) its rows in sync too.
      const category = this.activityCategory();
      const isFirstUnfilteredPage = this.activityPage() === 1 && !category;

      if (isFirstUnfilteredPage) {
        this.activity.update((feed) =>
          feed
            ? {
                ...feed,
                entries: [entry, ...feed.entries].slice(0, feed.pageSize),
                totalCount: feed.totalCount + 1,
                categories: feed.categories.includes(entry.category)
                  ? feed.categories
                  : [...feed.categories, entry.category].sort(),
              }
            : feed
        );
      }
    });

    this.activityHub.start().catch(() => {
      // A dropped/failed live connection just means the Overview feed falls
      // back to whatever was last fetched — every section still works via its
      // normal manual refresh, so this is silently non-fatal.
    });
  }

  ngOnDestroy(): void {
    this.activityHubSubscription?.unsubscribe();
    this.activityHub.stop();
  }

  setTab(tab: TabKey): void {
    this.activeTab.set(tab);
  }

  setSection(section: SectionKey): void {
    this.activeSection.set(section);
    this.actionMessage.set('');

    // Loaded on first visit rather than up front, so opening the dashboard costs
    // one request instead of three.
    if (section === 'overview') {
      if (!this.report()) {
        this.loadReports();
      }
      if (!this.activity()) {
        this.loadActivity();
      }
    }

    if (section === 'reports' && !this.report()) {
      this.loadReports();
    }

    if (section === 'activity' && !this.activity()) {
      this.loadActivity();
    }

    if (section === 'instructors' && !this.instructors()) {
      this.loadInstructors();
    }

    if (section === 'students' && !this.students()) {
      this.loadStudents();
    }

    if (section === 'classrooms' && !this.classroomsAdmin()) {
      this.loadClassroomsAdmin();
    }

    if (section === 'deletedClassrooms' && !this.deletedClassroomsAdmin()) {
      this.loadDeletedClassroomsAdmin();
    }
  }

  // ---- Instructors -----------------------------------------------------------

  loadInstructors(): void {
    this.instructorsLoading.set(true);

    this.adminService.getInstructors().subscribe({
      next: (instructors) => {
        this.instructors.set(instructors);
        this.instructorsLoading.set(false);
      },
      error: () => {
        this.instructorsLoading.set(false);
        this.errorMessage.set('Unable to load instructors.');
      },
    });
  }

  toggleCreateInstructorForm(): void {
    this.showCreateInstructorForm.update((open) => !open);
    this.createInstructorError.set('');

    if (!this.showCreateInstructorForm()) {
      this.resetCreateInstructorForm();
    }
  }

  private resetCreateInstructorForm(): void {
    this.newInstructorFirstName.set('');
    this.newInstructorMiddleName.set('');
    this.newInstructorLastName.set('');
    this.newInstructorEmail.set('');
    this.newInstructorPassword.set('');
  }

  submitCreateInstructor(): void {
    if (this.creatingInstructor()) {
      return;
    }

    if (!this.newInstructorFirstName().trim() || !this.newInstructorLastName().trim()
      || !this.newInstructorEmail().trim() || !this.newInstructorPassword().trim()) {
      this.createInstructorError.set('First name, last name, email and password are all required.');
      return;
    }

    this.creatingInstructor.set(true);
    this.createInstructorError.set('');

    this.adminService
      .createInstructor({
        firstName: this.newInstructorFirstName().trim(),
        middleName: this.newInstructorMiddleName().trim() || null,
        lastName: this.newInstructorLastName().trim(),
        email: this.newInstructorEmail().trim(),
        password: this.newInstructorPassword(),
      })
      .subscribe({
        next: (result) => {
          this.creatingInstructor.set(false);
          this.showCreateInstructorForm.set(false);
          this.resetCreateInstructorForm();
          this.actionMessage.set(`Instructor account created for ${result.data.email}.`);
          this.instructors.update((list) => (list ? [result.data, ...list] : [result.data]));
        },
        error: (error) => {
          this.creatingInstructor.set(false);
          this.createInstructorError.set(this.readError(error, 'Unable to create the instructor account.'));
        },
      });
  }

  startEditInstructor(instructor: InstructorAdmin): void {
    this.editingInstructorId.set(instructor.id);
    this.editInstructorFirstName.set(instructor.firstName);
    this.editInstructorMiddleName.set(instructor.middleName ?? '');
    this.editInstructorLastName.set(instructor.lastName);
    this.editInstructorEmail.set(instructor.email);
    this.editInstructorError.set('');
  }

  cancelEditInstructor(): void {
    this.editingInstructorId.set(null);
    this.editInstructorError.set('');
  }

  saveEditInstructor(instructor: InstructorAdmin): void {
    if (this.savingInstructor()) {
      return;
    }

    if (!this.editInstructorFirstName().trim() || !this.editInstructorLastName().trim()
      || !this.editInstructorEmail().trim()) {
      this.editInstructorError.set('First name, last name and email are all required.');
      return;
    }

    this.savingInstructor.set(true);
    this.editInstructorError.set('');

    this.adminService
      .updateInstructor(instructor.id, {
        firstName: this.editInstructorFirstName().trim(),
        middleName: this.editInstructorMiddleName().trim() || null,
        lastName: this.editInstructorLastName().trim(),
        email: this.editInstructorEmail().trim(),
      })
      .subscribe({
        next: (result) => {
          this.savingInstructor.set(false);
          this.editingInstructorId.set(null);
          this.actionMessage.set(`Updated ${result.data.email}.`);
          this.instructors.update((list) =>
            (list ?? []).map((item) => (item.id === instructor.id ? result.data : item))
          );
        },
        error: (error) => {
          this.savingInstructor.set(false);
          this.editInstructorError.set(this.readError(error, 'Unable to update this instructor.'));
        },
      });
  }

  // ---- Students ---------------------------------------------------------------

  loadStudents(): void {
    this.studentsLoading.set(true);

    this.adminService.getStudents().subscribe({
      next: (students) => {
        this.students.set(students);
        this.studentsLoading.set(false);
      },
      error: () => {
        this.studentsLoading.set(false);
        this.errorMessage.set('Unable to load students.');
      },
    });
  }

  startEditStudent(student: StudentAdmin): void {
    this.editingStudentId.set(student.id);
    this.editStudentFirstName.set(student.firstName);
    this.editStudentMiddleName.set(student.middleName ?? '');
    this.editStudentLastName.set(student.lastName);
    this.editStudentEmail.set(student.email);
    this.editStudentNumber.set(student.studentId);
    this.editStudentSection.set(student.section);
    this.editStudentError.set('');
  }

  cancelEditStudent(): void {
    this.editingStudentId.set(null);
    this.editStudentError.set('');
  }

  saveEditStudent(student: StudentAdmin): void {
    if (this.savingStudent()) {
      return;
    }

    if (!this.editStudentFirstName().trim() || !this.editStudentLastName().trim()
      || !this.editStudentEmail().trim() || !this.editStudentNumber().trim()
      || !this.editStudentSection().trim()) {
      this.editStudentError.set('First name, last name, email, student ID and section are all required.');
      return;
    }

    this.savingStudent.set(true);
    this.editStudentError.set('');

    this.adminService
      .updateStudent(student.id, {
        firstName: this.editStudentFirstName().trim(),
        middleName: this.editStudentMiddleName().trim() || null,
        lastName: this.editStudentLastName().trim(),
        email: this.editStudentEmail().trim(),
        studentId: this.editStudentNumber().trim(),
        section: this.editStudentSection().trim(),
      })
      .subscribe({
        next: (result) => {
          this.savingStudent.set(false);
          this.editingStudentId.set(null);
          this.actionMessage.set(`Updated ${result.data.email}.`);
          this.students.update((list) =>
            (list ?? []).map((item) => (item.id === student.id ? result.data : item))
          );
        },
        error: (error) => {
          this.savingStudent.set(false);
          this.editStudentError.set(this.readError(error, 'Unable to update this student.'));
        },
      });
  }

  // ---- Shared account deletion --------------------------------------------------

  startDeleteUser(userId: string): void {
    this.confirmingDeleteUserId.set(userId);
  }

  cancelDeleteUser(): void {
    this.confirmingDeleteUserId.set(null);
  }

  confirmDeleteUser(userId: string, role: 'Instructor' | 'Student'): void {
    if (this.deletingUserId()) {
      return;
    }

    this.deletingUserId.set(userId);

    this.adminService.deleteUser(userId).subscribe({
      next: (result) => {
        this.deletingUserId.set(null);
        this.confirmingDeleteUserId.set(null);
        this.actionMessage.set(result.message);

        if (role === 'Instructor') {
          this.instructors.update((list) => (list ?? []).filter((item) => item.userId !== userId));
        } else {
          this.students.update((list) => (list ?? []).filter((item) => item.userId !== userId));
        }
      },
      error: (error) => {
        this.deletingUserId.set(null);
        this.actionMessage.set(this.readError(error, 'Unable to delete this account.'));
      },
    });
  }

  // ---- Shared role management --------------------------------------------------

  startEditRoles(userId: string, roles: string[]): void {
    this.editingRolesUserId.set(userId);
    this.editRolesSelected.set([...roles]);
    this.editRolesOriginal.set([...roles]);
    this.editRolesStudentIdInput.set('');
    this.editRolesSectionInput.set('');
    this.editRolesError.set('');
  }

  cancelEditRoles(): void {
    this.editingRolesUserId.set(null);
    this.editRolesError.set('');
  }

  isEditingRoles(userId: string): boolean {
    return this.editingRolesUserId() === userId;
  }

  isRoleSelected(role: string): boolean {
    return this.editRolesSelected().includes(role);
  }

  toggleEditRole(role: string): void {
    this.editRolesSelected.update((roles) =>
      roles.includes(role) ? roles.filter((r) => r !== role) : [...roles, role]
    );
  }

  /** Student is being newly granted (no existing Student profile) — needs an ID + section. */
  needsStudentDetails(): boolean {
    return this.editRolesSelected().includes('Student') && !this.editRolesOriginal().includes('Student');
  }

  saveEditRoles(userId: string): void {
    if (this.savingRoles()) {
      return;
    }

    if (this.editRolesSelected().length === 0) {
      this.editRolesError.set('An account must have at least one role.');
      return;
    }

    if (this.needsStudentDetails()
      && (!this.editRolesStudentIdInput().trim() || !this.editRolesSectionInput().trim())) {
      this.editRolesError.set('Student ID and section are required to grant the Student role to this account.');
      return;
    }

    this.savingRoles.set(true);
    this.editRolesError.set('');

    this.adminService
      .updateUserRoles(userId, {
        roles: this.editRolesSelected(),
        studentId: this.needsStudentDetails() ? this.editRolesStudentIdInput().trim() : null,
        section: this.needsStudentDetails() ? this.editRolesSectionInput().trim() : null,
      })
      .subscribe({
        next: (result) => {
          this.savingRoles.set(false);
          this.editingRolesUserId.set(null);
          this.actionMessage.set(`Updated roles for ${result.data.email}.`);

          // Granting/revoking Student or Instructor can add or remove the account
          // from either list (e.g. granting Student creates a profile row), so
          // just reload both rather than trying to patch them in place.
          this.loadInstructors();
          this.loadStudents();
        },
        error: (error) => {
          this.savingRoles.set(false);
          this.editRolesError.set(this.readError(error, 'Unable to update roles for this account.'));
        },
      });
  }

  // ---- Classrooms (read-only) ----------------------------------------------------

  loadClassroomsAdmin(): void {
    this.classroomsLoading.set(true);

    this.adminService.getClassrooms().subscribe({
      next: (classrooms) => {
        this.classroomsAdmin.set(classrooms);
        this.classroomsLoading.set(false);
      },
      error: () => {
        this.classroomsLoading.set(false);
        this.errorMessage.set('Unable to load classrooms.');
      },
    });
  }

  // ---- Deleted classrooms (recoverable) ---------------------------------------

  loadDeletedClassroomsAdmin(): void {
    this.deletedClassroomsLoading.set(true);

    this.adminService.getDeletedClassrooms().subscribe({
      next: (classrooms) => {
        this.deletedClassroomsAdmin.set(classrooms);
        this.deletedClassroomsLoading.set(false);
      },
      error: () => {
        this.deletedClassroomsLoading.set(false);
        this.errorMessage.set('Unable to load deleted classrooms.');
      },
    });
  }

  restoreClassroom(classroomId: string): void {
    if (this.restoringClassroomId()) {
      return;
    }

    this.restoringClassroomId.set(classroomId);

    this.adminService.restoreClassroom(classroomId).subscribe({
      next: (result) => {
        this.restoringClassroomId.set(null);
        this.actionMessage.set(result.message);
        this.deletedClassroomsAdmin.update((list) => (list ?? []).filter((c) => c.id !== classroomId));
        // The restored classroom should reappear in the normal list next time it's viewed.
        this.classroomsAdmin.set(null);
      },
      error: (error) => {
        this.restoringClassroomId.set(null);
        this.actionMessage.set(this.readError(error, 'Unable to restore this classroom.'));
      },
    });
  }

  loadReports(): void {
    this.reportLoading.set(true);

    this.adminService.getReports().subscribe({
      next: (report) => {
        this.report.set(report);
        this.reportLoading.set(false);
      },
      error: () => {
        this.reportLoading.set(false);
        this.errorMessage.set('Unable to load reports.');
      },
    });
  }

  loadActivity(): void {
    this.activityLoading.set(true);

    this.adminService
      .getActivity(this.activityCategory(), this.activityPage())
      .subscribe({
        next: (feed) => {
          this.activity.set(feed);
          this.activityLoading.set(false);

          // Seeds the Overview page's live feed the first time activity data
          // arrives. If a SignalR push already beat this fetch to the punch,
          // that live entry is newer than anything in this page, so it's left
          // alone rather than overwritten with slightly-stale fetched rows.
          if (this.liveActivity().length === 0) {
            this.liveActivity.set(feed.entries.slice(0, 5));
          }
        },
        error: () => {
          this.activityLoading.set(false);
          this.errorMessage.set('Unable to load the activity log.');
        },
      });
  }

  filterActivity(category: string | null): void {
    this.activityCategory.set(category);
    this.activityPage.set(1);
    this.loadActivity();
  }

  changeActivityPage(delta: number): void {
    const next = this.activityPage() + delta;

    if (next < 1 || next > this.activityTotalPages()) {
      return;
    }

    this.activityPage.set(next);
    this.loadActivity();
  }

  refresh(): void {
    this.actionMessage.set('');
    this.load();
  }

  /** Reloads the two data sources the Overview page's cards/panels depend on. */
  refreshOverview(): void {
    this.actionMessage.set('');
    this.loadReports();
    this.loadActivity();
  }

  /** Jumps to Instructors and opens the create-instructor form, unless it's already open. */
  quickAddInstructor(): void {
    this.setSection('instructors');

    if (!this.showCreateInstructorForm()) {
      this.showCreateInstructorForm.set(true);
      this.createInstructorError.set('');
    }
  }

  adminDisplayName(): string {
    return this.auth.getUserName() || 'Administrator';
  }

  adminInitials(): string {
    const name = this.adminDisplayName();

    if (!name) {
      return 'AD';
    }

    const atIndex = name.indexOf('@');
    const base = atIndex > 0 ? name.slice(0, atIndex) : name;
    const parts = base.split(/[\s._-]+/).filter(Boolean);

    if (parts.length === 0) {
      return 'AD';
    }

    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'AD';
  }

  approve(account: AccountRequest): void {
    if (this.busyUserId()) {
      return;
    }

    this.busyUserId.set(account.userId);
    this.actionMessage.set('');

    this.adminService.approve(account.userId).subscribe({
      next: () => {
        this.actionMessage.set(`Approved ${account.fullName}. They can sign in now.`);
        this.busyUserId.set(null);
        this.load(false);
      },
      error: (error) => {
        this.actionMessage.set(this.readError(error, 'Unable to approve this account.'));
        this.busyUserId.set(null);
      },
    });
  }

  startReject(account: AccountRequest): void {
    this.rejectingUserId.set(account.userId);
    this.rejectReason.set('');
    this.actionMessage.set('');
  }

  cancelReject(): void {
    this.rejectingUserId.set(null);
    this.rejectReason.set('');
  }

  confirmReject(account: AccountRequest): void {
    if (this.busyUserId()) {
      return;
    }

    this.busyUserId.set(account.userId);

    this.adminService.reject(account.userId, this.rejectReason().trim()).subscribe({
      next: () => {
        this.actionMessage.set(`Rejected ${account.fullName}.`);
        this.busyUserId.set(null);
        this.cancelReject();
        this.load(false);
      },
      error: (error) => {
        this.actionMessage.set(this.readError(error, 'Unable to reject this account.'));
        this.busyUserId.set(null);
      },
    });
  }

  isBusy(account: AccountRequest): boolean {
    return this.busyUserId() === account.userId;
  }

  isRejecting(account: AccountRequest): boolean {
    return this.rejectingUserId() === account.userId;
  }

  initials(account: AccountRequest): string {
    return account.fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }

  statusClass(status: string): string {
    return `status status-${status.toLowerCase()}`;
  }

  private load(showLoading = true): void {
    if (showLoading) {
      this.loading.set(true);
    }

    this.adminService.getAccountQueue().subscribe({
      next: (queue) => {
        this.queue.set(queue);
        this.errorMessage.set('');
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(
          error?.status === 401 || error?.status === 403
            ? 'You are not signed in as an administrator.'
            : 'Unable to load the account queue.'
        );
      },
    });
  }

  /** The API returns a bare string for failures, an object for framework errors. */
  private readError(error: unknown, fallback: string): string {
    const body = (error as { error?: unknown })?.error;

    if (typeof body === 'string' && body.trim()) {
      return body;
    }

    const message = (body as { message?: string })?.message;
    return message?.trim() ? message : fallback;
  }
}
