import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InstructorClassroomDetail } from './instructor-classroom-detail';
import { InstructorClassroomService } from '../../services/instructor-classroom-service';
import { Auth } from '../../../auth/services/auth';
import { QuizLeaderboard } from '../../interfaces/quiz-leaderboard.model';

const data = (quizId: number): QuizLeaderboard => ({ quizId, quizTitle: 'Quiz', classroomId: 'c1',
  totalPoints: 1, passingScore: 60, enrolledCount: 5, submittedCount: 0,
  classAveragePercentage: null, rows: [], itemAnalysis: [] });

describe('Results tab requests', () => {
  let requests: Subject<QuizLeaderboard>[];
  let api: { getQuizLeaderboard: ReturnType<typeof vi.fn> };
  beforeEach(() => {
    requests = [];
    api = { getQuizLeaderboard: vi.fn(() => {
      const request = new Subject<QuizLeaderboard>();
      requests.push(request);
      return request;
    }) };
    TestBed.configureTestingModule({ imports: [InstructorClassroomDetail], providers: [
      { provide: InstructorClassroomService, useValue: api },
      { provide: MatDialog, useValue: {} },
      { provide: Auth, useValue: { getUserName: () => 'Instructor', getUserRole: () => 'Instructor' } },
      { provide: Router, useValue: { events: new Subject(), navigate: vi.fn() } },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: 'c1' }), queryParamMap: convertToParamMap({ tab: 'results' }) } } },
    ] });
  });

  it('cancels the previous quiz request and clears old analytics', () => {
    const page = TestBed.createComponent(InstructorClassroomDetail).componentInstance;
    page.selectResultsQuiz(1);
    page.selectResultsQuiz(2);
    expect(requests[0].observed).toBe(false);
    requests[0].next(data(1));
    expect(page.leaderboard()).toBeNull();
    requests[1].next(data(2));
    expect(page.leaderboard()?.quizId).toBe(2);
    expect(page.leaderboardLoading()).toBe(false);
    page.selectResultsQuiz(3);
    expect(page.leaderboard()).toBeNull();
    expect(page.leaderboardLoading()).toBe(true);
  });

  it('allows refresh and retry for the selected quiz after an error', () => {
    const page = TestBed.createComponent(InstructorClassroomDetail).componentInstance;
    page.selectResultsQuiz(7);
    requests[0].error({ error: { message: 'Results temporarily unavailable' } });
    expect(page.leaderboardError()).toBe('Results temporarily unavailable');
    expect(page.leaderboardLoading()).toBe(false);
    page.refreshResults();
    expect(api.getQuizLeaderboard).toHaveBeenLastCalledWith(7);
    expect(page.leaderboardError()).toBe('');
    requests[1].next(data(7));
    expect(page.leaderboard()?.quizId).toBe(7);
  });

  it('unsubscribes on destruction and does not refresh without a selected quiz', () => {
    const fixture = TestBed.createComponent(InstructorClassroomDetail);
    fixture.componentInstance.refreshResults();
    expect(api.getQuizLeaderboard).not.toHaveBeenCalled();
    fixture.componentInstance.selectResultsQuiz(1);
    fixture.destroy();
    expect(requests[0].observed).toBe(false);
  });
});
