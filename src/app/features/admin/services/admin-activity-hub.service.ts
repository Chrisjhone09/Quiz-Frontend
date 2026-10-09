import { Injectable, inject } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { environment } from '../../../../environments/enviroment.developement';
import { Auth } from '../../auth/services/auth';
import { ActivityLogEntry } from '../interfaces/admin.model';

/**
 * Live feed of newly-written activity log entries, pushed from the server the
 * moment they're recorded (logins, logouts, approvals, classroom changes,
 * quiz events — anything that goes through the backend's ActivityLogger).
 *
 * Admin-only: the hub itself is [Authorize(Roles = "Admin")], so a non-admin
 * token simply can't establish the connection. Mirrors the connection pattern
 * already used for quiz monitoring (QuizMonitoringRealtimeService), just with
 * a bearer token attached since this hub requires authentication.
 */
@Injectable({
  providedIn: 'root',
})
export class AdminActivityHubService {
  private readonly auth = inject(Auth);
  private connection?: signalR.HubConnection;

  readonly activityLogged$ = new Subject<ActivityLogEntry>();

  async start(): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    if (!this.connection) {
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(`${environment.apiUrl}/hubs/activity`, {
          accessTokenFactory: () => this.auth.getToken() ?? '',
        })
        .withAutomaticReconnect()
        .build();

      this.connection.on('ActivityLogged', (entry: ActivityLogEntry) => {
        this.activityLogged$.next(entry);
      });
    }

    if (this.connection.state === signalR.HubConnectionState.Disconnected) {
      await this.connection.start();
    }
  }

  async stop(): Promise<void> {
    if (this.connection && this.connection.state !== signalR.HubConnectionState.Disconnected) {
      await this.connection.stop();
    }
  }
}
