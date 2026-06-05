import { Component, computed, input, Input, OnInit, Output, output, signal } from '@angular/core';
import { ClassroomModel } from '../../../../shared/interfaces/classrooms.model';
import { Auth } from '../../../auth/services/auth';
import { StatsCardModel } from '../../interfaces/stats-card.model';
import { ClassroomList } from '../../../../shared/components/classroom-list/classroom-list';
import { FormsModule } from '@angular/forms';
import { UpcomingQuizzes } from '../../components/upcoming-quizzes/upcoming-quizzes';
import { QuizActivity } from '../../components/quiz-activity/quiz-activity';
import { QuizActivityModel } from '../../interfaces/quiz-activity.model';
import { RouterOutlet } from '@angular/router';
import { QuizModel } from '../../interfaces/quiz.model';
import { StatsCard } from '../../../../shared/components/stats-card/stats-card';
import { StudentClassroomService } from '../../services/student-classroom-service';

@Component({
  selector: 'app-student-dashboard',
  imports: [StatsCard, ClassroomList, FormsModule, UpcomingQuizzes, QuizActivity, RouterOutlet],
  templateUrl: './student-dashboard.html',
  styleUrl: './student-dashboard.css',
})
export class StudentDashboard implements OnInit {

  classrooms = signal<ClassroomModel[]>([]);
  upcomingQuizzes = computed(() =>
    this.classrooms().flatMap(c => c.quizzes ?? [])
  );

  statsCards = computed<StatsCardModel[]>(() => [
    {
      title: 'Classrooms',
      value: this.classrooms().length === 0 ? 0 : this.classrooms().length,
      icon: 'school'
    },
    {
      title: 'Pending Activities',
      value: this.upcomingQuizzes().length === 0 ? 0 : this.upcomingQuizzes().length,
      icon: 'quiz'
    }
  ]);


  quizActivities = signal<QuizActivityModel[]>([]);

  classroomCode: string = '';


  constructor(public authService: Auth, private classroomService: StudentClassroomService) {
  }

  ngOnInit() {
    this.loadClassrooms();
  }


  joinClassroom() {
    this.classroomService.joinClassroom({
      classCode: this.classroomCode,
      userId: this.authService.getUserId()
    }).subscribe({
      next: (response) => {
        this.classrooms.update(classrooms => [...classrooms, response]);
      }
    })

  }


  loadClassrooms() {
    this.classroomService.fetchAllClassrooms().subscribe({
      next: (data: ClassroomModel[]) => {
        console.log(data);
        this.classrooms.set(data);
      }
    });
  }

  leaveClassroom(classroomId: string) {
    this.classroomService.leaveClassroom(classroomId).subscribe({
      next: () => {
        console.log("triggred")
        this.classrooms.update(classrooms => classrooms.filter(c=> c.id !== classroomId))
      }
    })
  }

}
