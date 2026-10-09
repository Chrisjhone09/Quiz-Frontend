import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, computed, OnInit, signal } from '@angular/core';
import { ClassroomModel } from '../../interfaces/classrooms.model';
import { StudentModel } from '../../interfaces/student.model';
import { Announcement } from '../../interfaces/announcement.model';
import { ActivatedRoute, Router, RouterOutlet, RouterLinkWithHref } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { LeaveClassroomDialog } from '../../../features/student/components/leave-classroom-dialog/leave-classroom-dialog';
import { QuizList } from '../../../features/student/components/quiz-list/quiz-list';
import { Auth } from '../../../features/auth/services/auth';
import { StudentClassroomService } from '../../../features/student/services/student-classroom-service';
import { InstructorClassroomService } from '../../../features/instructor/services/instructor-classroom-service';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';

type StudentTabKey = 'quizzes' | 'announcements' | 'classmates';

@Component({
  selector: 'app-classroom',
  imports: [CommonModule, FormsModule, QuizList, RouterOutlet, RouterLinkWithHref, TimeAgoPipe, MatMenuModule, MatIconModule],
  templateUrl: './classroom.html',
  styleUrl: './classroom.css',
})
export class Classroom implements OnInit {


  constructor(private route: ActivatedRoute, private studentClassroomService: StudentClassroomService,
    public auth: Auth, private instructorClassroomService: InstructorClassroomService,
    private dialog: MatDialog, private router: Router) {

  }

  classroom = signal<ClassroomModel | null>(null);
  quizzes = computed(() => this.classroom()?.quizzes ?? []);
  pendingRequestCount = computed(() => this.classroom()?.pendingRequestCount ?? 0);

  /**
   * Set when the API refuses to return the classroom — most often because the
   * student's enrolment is still pending the instructor's approval.
   */
  accessMessage = signal('');

  readonly activeTab = signal<StudentTabKey>('quizzes');
  private leaveDialogOpen = false;

  requestLeave(): void {
    const classroom = this.classroom();
    if (!classroom || this.auth.getUserRole() !== 'Student' || this.leaveDialogOpen) return;
    this.leaveDialogOpen = true;
    this.dialog.open(LeaveClassroomDialog, {
      width: '460px',
      maxWidth: 'calc(100vw - 32px)',
      autoFocus: '#cancel-leave',
      data: { id: classroom.id, title: classroom.classroomTitle },
    }).afterClosed().subscribe((left) => {
      this.leaveDialogOpen = false;
      if (left === true) this.router.navigate(['/student-dashboard']);
    });
  }

  readonly classmates = signal<StudentModel[]>([]);
  readonly classmatesLoading = signal(false);
  private classmatesLoaded = false;

  readonly announcements = signal<Announcement[]>([]);
  readonly announcementsLoading = signal(false);
  private announcementsLoaded = false;

  /** Announcement currently being acknowledged, so only that button shows "Acknowledging…". */
  readonly acknowledgingId = signal<string | null>(null);

  selectTab(tab: StudentTabKey): void {
    this.activeTab.set(tab);

    if (tab === 'classmates' && !this.classmatesLoaded) {
      this.loadClassmates();
    }
    if (tab === 'announcements' && !this.announcementsLoaded) {
      this.loadAnnouncements();
    }
  }

  acknowledge(announcement: Announcement): void {
    if (this.acknowledgingId() || announcement.acknowledgedByMe) {
      return;
    }

    this.acknowledgingId.set(announcement.id);

    this.studentClassroomService.acknowledgeAnnouncement(announcement.id).subscribe({
      next: (updated) => {
        this.acknowledgingId.set(null);
        this.announcements.update((list) =>
          list.map((a) => (a.id === announcement.id ? updated : a))
        );
      },
      error: () => {
        this.acknowledgingId.set(null);
      },
    });
  }

  /** Initials for an announcement poster's display name (e.g. "Jane Doe" -> "JD"),
   * matching the avatar convention used for the classmate list above. */
  initialsForName(name: string): string {
    const parts = (name ?? '').split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return '?';
    }
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
  }

  private loadClassmates(): void {
    const classroomId = this.classroom()?.id;
    if (!classroomId) return;

    this.classmatesLoaded = true;
    this.classmatesLoading.set(true);
    this.studentClassroomService.getClassmates(classroomId).subscribe({
      next: (students) => {
        this.classmates.set(students ?? []);
        this.classmatesLoading.set(false);
      },
      error: () => {
        this.classmatesLoading.set(false);
      },
    });
  }

  private loadAnnouncements(): void {
    const classroomId = this.classroom()?.id;
    if (!classroomId) return;

    this.announcementsLoaded = true;
    this.announcementsLoading.set(true);
    this.studentClassroomService.getAnnouncements(classroomId).subscribe({
      next: (announcements) => {
        this.announcements.set(announcements ?? []);
        this.announcementsLoading.set(false);
      },
      error: () => {
        this.announcementsLoading.set(false);
      },
    });
  }

  ngOnInit() {
    const classroomId = this.route.snapshot.paramMap.get('id');

    if (!classroomId) return;

    if (this.auth.getUserRole() === "Student") {
      this.studentClassroomService.getClassroomById(classroomId).subscribe({
        next: (response) => {
          this.classroom.set(response as ClassroomModel);
        },
        error: (error) => {
          const body = error?.error;
          this.accessMessage.set(
            typeof body === 'string' && body.trim()
              ? body
              : 'This classroom is not available to you.'
          );
        }
      });
      return;
    }

    this.instructorClassroomService.getClassroom(classroomId).subscribe({
      next: (response: ClassroomModel) => {
        this.classroom.set(response)
      },
      error: () => {
        this.accessMessage.set('Unable to load this classroom.');
      }
    })
  }






}
