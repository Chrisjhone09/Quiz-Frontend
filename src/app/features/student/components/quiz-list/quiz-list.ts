import { Component, input, signal } from '@angular/core';
import { QuizModel } from '../../interfaces/quiz.model';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-quiz-list',
  imports: [NgClass],
  templateUrl: './quiz-list.html',
  styleUrl: './quiz-list.css',
})
export class QuizList {

  quizzes = input<QuizModel[] | null>(null);



}
