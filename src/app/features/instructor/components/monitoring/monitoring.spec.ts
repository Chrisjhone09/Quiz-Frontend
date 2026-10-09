import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { of, Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Monitoring } from './monitoring';
import { InstructorClassroomService } from '../../services/instructor-classroom-service';
import { QuizMonitoringRealtimeService } from '../../../../shared/services/quiz-monitoring-realtime.service';
import { MonitoringStudent } from '../../interfaces/monitoring.model';

describe('Monitoring controls', () => {
  let component: Monitoring;
  let confirmation: Subject<boolean>;
  let forceSubmit: ReturnType<typeof vi.fn>;
  const student: MonitoringStudent = { studentId: 's1', fullName: 'Maria Santos', studentNumber: '2024-001', section: 'A', status: 'Taking', tabSwitchCount: 2, totalPoints: 10, logs: [] };
  const dashboard = { classroomId: 'c1', selectedQuizId: 1, quizzes: [{ id: 1, title: 'Biology', status: 'Published' }], students: [student], eventFeed: [] };

  beforeEach(() => {
    confirmation = new Subject();
    forceSubmit = vi.fn(() => new Subject());
    TestBed.configureTestingModule({ providers: [
      { provide: ActivatedRoute, useValue: {} },
      { provide: InstructorClassroomService, useValue: { forceSubmit, getMonitoring: vi.fn(() => of(dashboard)) } },
      { provide: QuizMonitoringRealtimeService, useValue: { joinQuizMonitoring: vi.fn(async () => {}) } },
      { provide: MatDialog, useValue: { open: vi.fn(() => ({ afterClosed: () => confirmation })) } },
    ] });
    component = TestBed.runInInjectionContext(() => new Monitoring(
      TestBed.inject(ActivatedRoute), TestBed.inject(InstructorClassroomService),
      TestBed.inject(QuizMonitoringRealtimeService), TestBed.inject(MatDialog)
    ));
    component.selectedQuizId.set(1);
    component.dashboard.set(dashboard);
  });

  it('filters students by name, number, status and tab switches', () => {
    component.search.set('2024-001');
    expect(component.filteredStudents()).toHaveLength(1);
    component.statusFilter.set('Submitted');
    expect(component.filteredStudents()).toHaveLength(0);
    component.statusFilter.set('Taking');
    component.alertsOnly.set(true);
    expect(component.filteredStudents()).toHaveLength(1);
    component.search.set('Other student');
    expect(component.filteredStudents()).toHaveLength(0);
  });

  it('does not submit an attempt when confirmation is cancelled', () => {
    component.forceSubmit(student);
    expect(forceSubmit).not.toHaveBeenCalled();
    confirmation.next(false);
    expect(forceSubmit).not.toHaveBeenCalled();
  });

  it('submits only after explicit confirmation and prevents duplicate actions', () => {
    component.forceSubmit(student);
    confirmation.next(true);
    expect(forceSubmit).toHaveBeenCalledExactlyOnceWith({ studentId: 's1', quizId: 1 });
    component.forceSubmit(student);
    expect(forceSubmit).toHaveBeenCalledTimes(1);
  });

  it('ignores confirmation if the instructor switched to another quiz', () => {
    component.forceSubmit(student);
    component.selectedQuizId.set(2);
    confirmation.next(true);
    expect(forceSubmit).not.toHaveBeenCalled();
  });

  it('never sends force submit for an attempt that has already finished', () => {
    component.dashboard.set({ ...dashboard, students: [{ ...student, status: 'Submitted' }] });
    component.forceSubmit(student);
    confirmation.next(true);
    expect(forceSubmit).not.toHaveBeenCalled();
  });
});
