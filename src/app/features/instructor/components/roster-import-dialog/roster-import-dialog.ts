import { Component, OnDestroy, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { InstructorClassroomService } from '../../services/instructor-classroom-service';
import { ClassroomRosterImport } from '../../interfaces/classroom-roster.model';

export interface RosterImportData { classroomId: string; classroomTitle: string; }

@Component({
  selector: 'app-roster-import-dialog',
  imports: [MatDialogModule, MatIconModule],
  templateUrl: './roster-import-dialog.html', styleUrl: './roster-import-dialog.css',
})
export class RosterImportDialog implements OnDestroy {
  readonly data = inject<RosterImportData>(MAT_DIALOG_DATA);
  private readonly service = inject(InstructorClassroomService);
  private readonly dialog = inject(MatDialogRef<RosterImportDialog>);
  private request?: Subscription;
  readonly file = signal<File | null>(null);
  readonly result = signal<ClassroomRosterImport | null>(null);
  readonly busy = signal(false);
  readonly error = signal('');

  selectFile(event: Event): void {
    if (this.busy()) return;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.result.set(null);
    this.error.set('');
    this.file.set(null);
    if (!file) return;
    if (!/\.csv$/i.test(file.name)) this.error.set('Choose a .csv file.');
    else if (file.size > 1024 * 1024) this.error.set('CSV files must be 1 MB or smaller.');
    else if (file.size === 0) this.error.set('This CSV file is empty.');
    else this.file.set(file);
  }

  preview(): void { this.send(true); }
  import(): void { if (this.result()?.canImport) this.send(false); }

  private send(preview: boolean): void {
    const file = this.file();
    if (!file || this.busy() || this.result()?.imported) return;
    this.busy.set(true);
    this.error.set('');
    this.dialog.disableClose = true;
    this.request = this.service.importRoster(this.data.classroomId, file, preview).subscribe({
      next: (result) => { this.result.set(result); this.finish(); },
      error: (error) => {
        this.error.set(typeof error?.error === 'string' ? error.error : error?.error?.message ?? 'Unable to process the roster. Please try again.');
        // The server rechecks every ID on import; require a fresh preview after a conflict.
        if (!preview) this.result.set(null);
        this.finish();
      },
    });
  }

  private finish(): void { this.busy.set(false); this.dialog.disableClose = false; }
  close(): void { if (!this.busy()) this.dialog.close(this.result()?.imported ? this.result() : null); }
  ngOnDestroy(): void { this.request?.unsubscribe(); }

  downloadTemplate(): void {
    const url = URL.createObjectURL(new Blob(['Student ID\r\n2024-001\r\n2024-002\r\n'], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url; link.download = 'classroom-student-roster.csv'; link.click();
    URL.revokeObjectURL(url);
  }
}
