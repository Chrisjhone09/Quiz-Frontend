import { Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { StudentClassroomService } from '../../services/student-classroom-service';

export interface LeaveClassroomData {
  id: string;
  title: string;
}

@Component({
  selector: 'app-leave-classroom-dialog',
  imports: [MatDialogModule, MatIconModule],
  templateUrl: './leave-classroom-dialog.html',
  styleUrl: './leave-classroom-dialog.css',
})
export class LeaveClassroomDialog {
  readonly data = inject<LeaveClassroomData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<LeaveClassroomDialog>);
  private readonly classroomService = inject(StudentClassroomService);
  readonly leaving = signal(false);
  readonly error = signal('');

  cancel(): void {
    if (!this.leaving()) this.dialogRef.close(false);
  }

  confirm(): void {
    if (this.leaving()) return;
    this.leaving.set(true);
    this.error.set('');
    this.dialogRef.disableClose = true;
    this.classroomService.leaveClassroom(this.data.id).subscribe({
      next: () => this.dialogRef.close(true),
      error: (error) => {
        this.leaving.set(false);
        this.dialogRef.disableClose = false;
        this.error.set(typeof error?.error === 'string' ? error.error
          : error?.error?.message ?? 'Unable to leave this classroom. Please try again.');
      },
    });
  }
}
