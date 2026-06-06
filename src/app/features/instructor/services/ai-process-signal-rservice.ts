import { Injectable, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../../environments/enviroment.developement';
import { ProcessingStatus, ProcessingTask } from '../components/quiz-generator/quiz-generator.models';
import { Title } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root',
})
export class AiProcessSignalRService {
  private hubConnection?: signalR.HubConnection;


  readonly tasks = signal<ProcessingTask[]>([
    {
      title: 'Reading document',
      status: 'Pending',
    },
    {
      title: 'Analyzing topics & concepts',
      status: 'Pending',
    },
    {
      title: 'Extracting question seeds',
      status: 'Pending',
    },
    {
      title: 'Generating questions',
      status: 'Pending',
    },
  ]);


  readonly connectionId = signal<string | null>(null);

  async startConnection(): Promise<string | null> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      return this.hubConnection.connectionId;
    }

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(environment.apiUrl + '/quiz-process')
      .withAutomaticReconnect()
      .build();

    this.hubConnection.on('ReceiveUpdate', (process: ProcessingTask) => {
      console.log(process)
      this.tasks.update(tasks =>
        tasks.map(task =>
          task.title === process.title
            ? { ...task, status: process.status, description: process.description }
            : task
        )
      );
    });

    this.hubConnection.onreconnected(id => {
      this.connectionId.set(id ?? null);
    });

    await this.hubConnection.start();

    this.connectionId.set(this.hubConnection.connectionId);

    console.log('SignalR connected');

    return this.hubConnection.connectionId;
  }

  stopConnection(): void {
    this.hubConnection?.stop();
    this.connectionId.set(null);
  }
}
