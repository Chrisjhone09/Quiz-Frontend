import { Component, computed, OnInit, signal } from '@angular/core';
import { ClassroomModel } from '../../interfaces/classrooms.model';
import { ActivatedRoute, RouterOutlet, RouterLinkWithHref } from '@angular/router';
import { QuizList } from '../../../features/student/components/quiz-list/quiz-list';
import { Auth } from '../../../features/auth/services/auth';
import { StudentClassroomService } from '../../../features/student/services/student-classroom-service';
import { InstructorClassroomService } from '../../../features/instructor/services/instructor-classroom-service';

@Component({
  selector: 'app-classroom',
  imports: [QuizList, RouterOutlet, RouterLinkWithHref],
  templateUrl: './classroom.html',
  styleUrl: './classroom.css',
})
export class Classroom implements OnInit {


  constructor(private route: ActivatedRoute, private studentClassroomService: StudentClassroomService,
    public auth: Auth, private instructorClassroomService: InstructorClassroomService) {

  }

  classroom = signal<ClassroomModel | null>(null);
  quizzes = computed(() => this.classroom()?.quizzes ?? []);

  ngOnInit() {
    const classroomId = this.route.snapshot.paramMap.get('id');
    console.log("[CLASSROOM ID]", classroomId);

    if (!classroomId) return;
    //If user is Student
    if (this.auth.getUserRole() === "Student") {
      this.studentClassroomService.getClassroomById(classroomId).subscribe({
        next: (response) => {
          console.log("[RESPONSE]", response);
          this.classroom.set(response as ClassroomModel);

          console.log("[QUIZZES]", this.classroom()?.quizzes);

          return;
        },
        error: (err) => {
          console.error("[ERROR]", err);
        }
      });
      return;
    }
    
    this.instructorClassroomService.getClassroom(classroomId).subscribe({
      next: (response : ClassroomModel) => {
        this.classroom.set(response)
      }
    })


  }






}
