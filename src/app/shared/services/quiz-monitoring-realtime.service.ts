import { Injectable, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/enviroment.developement';

export interface RealtimeMonitoringLog {
  id: string;
  attemptId: number;
  studentId: string;
  quizId: number;
  studentName: string;
  action: string;
  timeStamp: string;
}

export interface StudentWarningEvent {
  studentId: string;
  quizId: number;
  message: string;
}

export interface ForceSubmitEvent {
  studentId: string;
  quizId: number;
}

@Injectable({
  providedIn: 'root',
})
export class QuizMonitoringRealtimeService {
  private connection?: signalR.HubConnection;
  readonly connected = signal(false);
  private readonly monitoringQuizzes = new Set<number>();
  private readonly studentQuizzes = new Map<string, { quizId: number; studentId: string }>();

  readonly monitoringEvent$ = new Subject<RealtimeMonitoringLog>();
  readonly warning$ = new Subject<StudentWarningEvent>();
  readonly forceSubmit$ = new Subject<ForceSubmitEvent>();

  async start(): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    if (!this.connection) {
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(`${environment.apiUrl}/quiz-process`)
        .withAutomaticReconnect()
        .build();

      this.connection.onreconnecting(() => this.connected.set(false));
      this.connection.onclose(() => this.connected.set(false));
      this.connection.onreconnected(async () => {
        try {
          for (const quizId of this.monitoringQuizzes) {
            await this.connection?.invoke('JoinQuizMonitoring', quizId);
          }
          for (const { quizId, studentId } of this.studentQuizzes.values()) {
            await this.connection?.invoke('JoinStudentQuiz', quizId, studentId);
          }
          this.connected.set(true);
        } catch {
          this.connected.set(false);
        }
      });

      this.connection.on('ReceiveMonitoringEvent', (event: RealtimeMonitoringLog) => {
        this.monitoringEvent$.next(event);
      });

      this.connection.on('ReceiveWarning', (event: StudentWarningEvent) => {
        this.warning$.next(event);
      });

      this.connection.on('ForceSubmit', (event: ForceSubmitEvent) => {
        this.forceSubmit$.next(event);
      });
    }

    if (this.connection.state === signalR.HubConnectionState.Disconnected) {
      await this.connection.start();
      this.connected.set(true);
    }
  }

  async joinQuizMonitoring(quizId: number): Promise<void> {
    await this.start();
    await this.connection?.invoke('JoinQuizMonitoring', quizId);
    this.monitoringQuizzes.add(quizId);
  }

  async joinStudentQuiz(quizId: number, studentId: string): Promise<void> {
    await this.start();
    await this.connection?.invoke('JoinStudentQuiz', quizId, studentId);
    this.studentQuizzes.set(`${quizId}:${studentId}`, { quizId, studentId });
  }
}
