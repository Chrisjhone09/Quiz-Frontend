import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RosterImportDialog } from './roster-import-dialog';
import { InstructorClassroomService } from '../../services/instructor-classroom-service';
import { ClassroomRosterImport } from '../../interfaces/classroom-roster.model';

describe('Roster import dialog', () => {
  let component: RosterImportDialog;
  let response: Subject<ClassroomRosterImport>;
  let importRoster: ReturnType<typeof vi.fn>;
  let dialog: { disableClose: boolean; close: ReturnType<typeof vi.fn> };
  const report: ClassroomRosterImport = { rows: [], imported: false, canImport: true, readyCount: 1, enrolledCount: 0,
    alreadyEnrolledCount: 0, waitingCount: 1, skippedCount: 0, numberOfStudents: 2, pendingRequestCount: 0 };
  const choose = (file: File) => component.selectFile({ target: { files: [file] } } as unknown as Event);

  beforeEach(() => {
    response = new Subject();
    importRoster = vi.fn(() => response);
    dialog = { disableClose: false, close: vi.fn() };
    TestBed.configureTestingModule({ providers: [
      { provide: MAT_DIALOG_DATA, useValue: { classroomId: 'c1', classroomTitle: 'Biology' } },
      { provide: MatDialogRef, useValue: dialog },
      { provide: InstructorClassroomService, useValue: { importRoster } },
    ] });
    component = TestBed.runInInjectionContext(() => new RosterImportDialog());
  });

  it('requires a valid file and successful preview before import', () => {
    component.preview(); component.import();
    expect(importRoster).not.toHaveBeenCalled();
    const file = new File(['Student ID\n001234'], 'students.csv');
    choose(file); component.import();
    expect(importRoster).not.toHaveBeenCalled();
    component.preview();
    expect(importRoster).toHaveBeenCalledExactlyOnceWith('c1', file, true);
    response.next(report);
    component.import();
    expect(importRoster).toHaveBeenLastCalledWith('c1', file, false);
  });

  it.each([
    new File(['data'], 'roster.xlsx'), new File([], 'roster.csv'), new File(['x'.repeat(1024 * 1024 + 1)], 'roster.csv'),
  ])('rejects invalid files locally', (file) => {
    choose(file); component.preview();
    expect(component.file()).toBeNull();
    expect(component.error()).not.toBe('');
    expect(importRoster).not.toHaveBeenCalled();
  });

  it('blocks duplicate requests, closing and file changes while processing', () => {
    const file = new File(['001234'], 'roster.csv');
    choose(file); component.preview(); component.preview(); component.close();
    choose(new File(['different'], 'other.csv'));
    expect(importRoster).toHaveBeenCalledTimes(1);
    expect(component.file()).toBe(file);
    expect(dialog.disableClose).toBe(true);
    expect(dialog.close).not.toHaveBeenCalled();
    response.next(report);
    expect(component.busy()).toBe(false);
    expect(dialog.disableClose).toBe(false);
  });

  it('requires a fresh preview after an import conflict', () => {
    choose(new File(['001234'], 'roster.csv'));
    component.result.set(report);
    component.import();
    response.error({ error: { message: 'Roster changed. Please preview again.' } });
    expect(component.result()).toBeNull();
    expect(component.error()).toContain('preview again');
    expect(component.busy()).toBe(false);
    expect(dialog.disableClose).toBe(false);
    component.import();
    expect(importRoster).toHaveBeenCalledTimes(1);
  });

  it('returns the completed report and prevents another import', () => {
    choose(new File(['001234'], 'roster.csv'));
    component.result.set(report);
    component.import();
    const completed = { ...report, imported: true, canImport: false };
    response.next(completed);
    component.preview(); component.import(); component.close();
    expect(importRoster).toHaveBeenCalledTimes(1);
    expect(dialog.close).toHaveBeenCalledExactlyOnceWith(completed);
  });

  it('invalidates the old preview when another file is selected', () => {
    component.result.set(report);
    choose(new File(['009999'], 'new.csv'));
    expect(component.result()).toBeNull();
    component.import();
    expect(importRoster).not.toHaveBeenCalled();
  });

  it('unsubscribes when destroyed', () => {
    choose(new File(['001234'], 'roster.csv')); component.preview(); component.ngOnDestroy();
    response.next(report);
    expect(component.result()).toBeNull();
  });
});
