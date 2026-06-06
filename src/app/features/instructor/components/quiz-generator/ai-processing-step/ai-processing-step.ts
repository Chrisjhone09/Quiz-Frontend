import { Component, computed, effect, inject, signal } from '@angular/core';
import { ProcessingTask } from '../quiz-generator.models';
import { AiProcessSignalRService } from '../../../services/ai-process-signal-rservice';

@Component({
  selector: 'app-ai-processing-step',
  imports: [],
  templateUrl: './ai-processing-step.html',
  styleUrl: './ai-processing-step.css',
})
export class AiProcessingStep {



  private signalRService = inject(AiProcessSignalRService);


  readonly tasks = this.signalRService.tasks;

  readonly progress = computed(
    () => this.tasks().filter((task) => task.status === 'Completed').length / 4 * 100,
  );

  readonly completedCount = computed(
    () => this.tasks().filter((task) => task.status === 'Completed').length,
  );

  constructor() {
    effect(() => {
      if (this.completedCount() === 4) {
        this.signalRService.stopConnection();
      }
    });
  }
  startProcessing(): void {
    // TODO: Implement AI processing
  }

  cancelProcessing(): void {
    // TODO: Implement processing cancellation
  }
}
