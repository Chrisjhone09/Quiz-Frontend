import { Component, Input } from '@angular/core';
import { QuizActivityModel } from '../../interfaces/quiz-activity.model';
import { TimeAgoPipe } from '../../../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-quiz-activity',
  imports: [TimeAgoPipe],
  templateUrl: './quiz-activity.html',
  styleUrl: './quiz-activity.css',
})
export class QuizActivity {


  @Input() quizActivities: QuizActivityModel[] = []
}
