import { Component, input, Input } from '@angular/core';
import { QuizModel } from '../../interfaces/quiz.model';

@Component({
  selector: 'app-upcoming-quizzes',
  imports: [],
  templateUrl: './upcoming-quizzes.html',
  styleUrl: './upcoming-quizzes.css',
})
export class UpcomingQuizzes {

  upcomingQuizzes = input<QuizModel[] | null>(null);

}
