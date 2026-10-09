import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { InstructorClassroomService } from '../../services/instructor-classroom-service';
import { QuizModel } from '../../../student/interfaces/quiz.model';
import { TimeAgoPipe } from '../../../../shared/pipes/time-ago.pipe';
import { PhilippineDatePipe } from '../../../../shared/pipes/philippine-date.pipe';

@Component({
  selector: 'app-instructor-quiz-list',
  standalone: true,
  imports: [TimeAgoPipe, PhilippineDatePipe],
  templateUrl: './instructor-quiz-list.html',
  styleUrl: './instructor-quiz-list.css',
})
export class InstructorQuizList implements OnInit {


  quizzes = signal<QuizModel[]>([])

  constructor(private route: ActivatedRoute, private classroomService: InstructorClassroomService){}

  ngOnInit() {
    const classroomId = this.route.parent?.snapshot.paramMap.get('id');
    this.classroomService.getQuizzes(classroomId).subscribe({
      next: (response : QuizModel[]) => {
        this.quizzes.set(response)
        console.log(response);
      }
    })
  }



}
