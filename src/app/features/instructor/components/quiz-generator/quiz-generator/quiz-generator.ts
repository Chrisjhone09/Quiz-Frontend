import { Component } from '@angular/core';
import { QuizGeneratorHeader } from '../quiz-generator-header/quiz-generator-header';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-quiz-generator',
  imports: [QuizGeneratorHeader, RouterOutlet],
  templateUrl: './quiz-generator.html',
  styleUrl: './quiz-generator.css',
})
export class QuizGenerator {}
