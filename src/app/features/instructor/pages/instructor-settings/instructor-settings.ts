import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../../auth/services/auth';
import { InstructorClassroomService } from '../../services/instructor-classroom-service';
import { InstructorProfileService } from '../../services/instructor-profile-service';
import { QuizDefaultsService } from '../../services/quiz-defaults-service';
import { ClassroomModel } from '../../../../shared/interfaces/classrooms.model';

@Component({
  selector: 'app-instructor-settings',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './instructor-settings.html',
  styleUrl: './instructor-settings.css',
})
export class InstructorSettings implements OnInit {
  private readonly profileService = inject(InstructorProfileService);
  private readonly quizDefaultsService = inject(QuizDefaultsService);
  private readonly classroomService = inject(InstructorClassroomService);
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  // ---- shell (sidebar/topbar) ----
  readonly userName = computed(() => this.auth.getUserName() || 'Instructor');
  readonly userRole = computed(() => this.auth.getUserRole() || 'Instructor');
  readonly initials = computed(() => this.initialsFor(this.userName()));
  readonly classrooms = signal<ClassroomModel[]>([]);

  // ---- profile ----
  readonly profileLoading = signal(true);
  readonly firstName = signal('');
  readonly middleName = signal('');
  readonly lastName = signal('');
  readonly email = signal('');
  readonly savingProfile = signal(false);
  readonly profileError = signal('');
  readonly profileSuccess = signal('');

  // ---- password ----
  readonly currentPassword = signal('');
  readonly newPassword = signal('');
  readonly confirmPassword = signal('');
  readonly changingPassword = signal(false);
  readonly passwordError = signal('');
  readonly passwordSuccess = signal('');

  // ---- default quiz settings ----
  readonly defaultTimeLimit = signal(60);
  readonly defaultPassingScore = signal(80);
  readonly defaultNotifyStudents = signal(true);
  readonly defaultAutoReleaseScore = signal(true);
  readonly defaultsMessage = signal('');

  ngOnInit(): void {
    this.classroomService.getClassrooms().subscribe({
      next: (classrooms) => this.classrooms.set(classrooms ?? []),
      error: () => this.classrooms.set([]),
    });

    this.loadProfile();
    this.loadDefaults();
  }

  signOut(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  private loadProfile(): void {
    this.profileLoading.set(true);
    this.profileService.getProfile().subscribe({
      next: (result) => {
        this.profileLoading.set(false);
        if (!result.success || !result.data) {
          this.profileError.set(result.message || 'Could not load your profile.');
          return;
        }
        this.firstName.set(result.data.firstName ?? '');
        this.middleName.set(result.data.middleName ?? '');
        this.lastName.set(result.data.lastName ?? '');
        this.email.set(result.data.email ?? '');
      },
      error: (error) => {
        this.profileLoading.set(false);
        this.profileError.set(this.extractError(error, 'Could not load your profile.'));
      },
    });
  }

  private loadDefaults(): void {
    const defaults = this.quizDefaultsService.defaults();
    this.defaultTimeLimit.set(defaults.timeLimit);
    this.defaultPassingScore.set(defaults.passingScore);
    this.defaultNotifyStudents.set(defaults.notifyStudents);
    this.defaultAutoReleaseScore.set(defaults.autoReleaseScore);
  }

  saveProfile(): void {
    const firstName = this.firstName().trim();
    const lastName = this.lastName().trim();

    if (!firstName || !lastName) {
      this.profileError.set('First and last name are required.');
      this.profileSuccess.set('');
      return;
    }

    this.profileError.set('');
    this.profileSuccess.set('');
    this.savingProfile.set(true);

    this.profileService
      .updateProfile({
        firstName,
        middleName: this.middleName().trim() || null,
        lastName,
      })
      .subscribe({
        next: (result) => {
          this.savingProfile.set(false);
          if (!result.success) {
            this.profileError.set(result.message || 'Could not save your profile.');
            return;
          }
          this.profileSuccess.set(result.message || 'Profile updated.');
        },
        error: (error) => {
          this.savingProfile.set(false);
          this.profileError.set(this.extractError(error, 'Could not save your profile.'));
        },
      });
  }

  changePassword(): void {
    this.passwordError.set('');
    this.passwordSuccess.set('');

    if (!this.currentPassword() || !this.newPassword()) {
      this.passwordError.set('Enter your current and new password.');
      return;
    }
    if (this.newPassword().length < 6) {
      this.passwordError.set('New password must be at least 6 characters.');
      return;
    }
    if (this.newPassword() !== this.confirmPassword()) {
      this.passwordError.set('New password and confirmation do not match.');
      return;
    }

    this.changingPassword.set(true);

    this.profileService
      .changePassword({
        currentPassword: this.currentPassword(),
        newPassword: this.newPassword(),
      })
      .subscribe({
        next: (result) => {
          this.changingPassword.set(false);
          if (!result.success) {
            this.passwordError.set(result.message || 'Could not change your password.');
            return;
          }
          this.passwordSuccess.set(result.message || 'Password changed.');
          this.currentPassword.set('');
          this.newPassword.set('');
          this.confirmPassword.set('');
        },
        error: (error) => {
          this.changingPassword.set(false);
          this.passwordError.set(this.extractError(error, 'Could not change your password.'));
        },
      });
  }

  saveDefaults(): void {
    this.quizDefaultsService.save({
      timeLimit: this.defaultTimeLimit() > 0 ? this.defaultTimeLimit() : 60,
      passingScore: this.defaultPassingScore(),
      notifyStudents: this.defaultNotifyStudents(),
      autoReleaseScore: this.defaultAutoReleaseScore(),
    });
    this.flashDefaultsMessage('Saved — new quizzes will start with these defaults.');
  }

  resetDefaults(): void {
    this.quizDefaultsService.reset();
    this.loadDefaults();
    this.flashDefaultsMessage('Reset to the built-in defaults.');
  }

  goToMonitoring(): void {
    const first = this.classrooms()[0];
    if (!first) {
      return;
    }
    this.router.navigate(['/instructor-classroom', first.id, 'monitoring']);
  }

  private flashDefaultsMessage(message: string): void {
    this.defaultsMessage.set(message);
    setTimeout(() => this.defaultsMessage.set(''), 2500);
  }

  private extractError(error: any, fallback: string): string {
    const body = error?.error;
    const message = typeof body === 'string' && body.trim() ? body : body?.message;
    return message?.trim() ? message : fallback;
  }

  private initialsFor(name: string): string {
    const parts = name.split(/[,\s]+/).filter(Boolean);
    if (parts.length === 0) {
      return 'IN';
    }
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return ((parts[1]?.[0] ?? '') + (parts[0]?.[0] ?? '')).toUpperCase();
  }
}
