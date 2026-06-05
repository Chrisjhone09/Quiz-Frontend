import { Component, Input } from '@angular/core';
import { QuizActivityModel } from '../../interfaces/quiz-activity.model';

@Component({
  selector: 'app-quiz-activity',
  imports: [],
  templateUrl: './quiz-activity.html',
  styleUrl: './quiz-activity.css',
})
export class QuizActivity {


  @Input() quizActivities: QuizActivityModel[] = []
}
