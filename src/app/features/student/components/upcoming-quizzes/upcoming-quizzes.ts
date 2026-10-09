import { Component, input, Input } from '@angular/core';
import { QuizModel } from '../../interfaces/quiz.model';
import { PhilippineDatePipe } from '../../../../shared/pipes/philippine-date.pipe';

@Component({
  selector: 'app-upcoming-quizzes',
  imports: [PhilippineDatePipe],
  templateUrl: './upcoming-quizzes.html',
  styleUrl: './upcoming-quizzes.css',
})
export class UpcomingQuizzes {

  upcomingQuizzes = input<QuizModel[] | null>(null);

}
