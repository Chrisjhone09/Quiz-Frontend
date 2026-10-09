import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subject, throwError } from 'rxjs';
import { describe, beforeEach, expect, it, vi } from 'vitest';
import { StudentClassroomService } from '../../services/student-classroom-service';
import { LeaveClassroomDialog } from './leave-classroom-dialog';

describe('Leave classroom confirmation', () => {
  let component: LeaveClassroomDialog;
  let request: Subject<unknown>;
  let service: { leaveClassroom: ReturnType<typeof vi.fn> };
  let dialog: { close: ReturnType<typeof vi.fn>; disableClose: boolean };

  beforeEach(() => {
    request = new Subject();
    service = { leaveClassroom: vi.fn(() => request) };
    dialog = { close: vi.fn(), disableClose: false };
    TestBed.configureTestingModule({ providers: [
      { provide: MAT_DIALOG_DATA, useValue: { id: 'class-1', title: 'Biology' } },
      { provide: MatDialogRef, useValue: dialog },
      { provide: StudentClassroomService, useValue: service },
    ] });
    component = TestBed.runInInjectionContext(() => new LeaveClassroomDialog());
  });

  it('opening and cancelling the dialog never leaves the class', () => {
    expect(service.leaveClassroom).not.toHaveBeenCalled();
    component.cancel();
    expect(dialog.close).toHaveBeenCalledWith(false);
    expect(service.leaveClassroom).not.toHaveBeenCalled();
  });

  it('requires confirmation and blocks duplicate submissions', () => {
    component.confirm();
    component.confirm();
    component.cancel();
    expect(service.leaveClassroom).toHaveBeenCalledExactlyOnceWith('class-1');
    expect(dialog.close).not.toHaveBeenCalled();
    expect(dialog.disableClose).toBe(true);
    request.next({});
    expect(dialog.close).toHaveBeenCalledWith(true);
  });

  it('keeps the dialog open on failure and allows retry', () => {
    service.leaveClassroom.mockReturnValueOnce(throwError(() => ({ error: { message: 'Try again' } })));
    component.confirm();
    expect(component.error()).toBe('Try again');
    expect(component.leaving()).toBe(false);
    expect(dialog.disableClose).toBe(false);
    expect(dialog.close).not.toHaveBeenCalled();
    component.confirm();
    expect(service.leaveClassroom).toHaveBeenCalledTimes(2);
  });
});
