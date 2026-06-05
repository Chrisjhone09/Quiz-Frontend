import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { InstructorClassroomService } from '../../services/instructor-classroom-service';
import { StudentModel } from '../../../../shared/interfaces/student.model';

@Component({
  selector: 'app-student-list',
  imports: [],
  templateUrl: './student-list.html',
  styleUrl: './student-list.css',
})
export class StudentList implements OnInit {

  students = signal<StudentModel[]>([]);

  constructor(private route: ActivatedRoute, private classroomService: InstructorClassroomService) { }
  ngOnInit(): void {
    const classroomId = this.route.parent?.snapshot.paramMap.get('id')
    console.log(classroomId);
    this.classroomService.getStudentList(classroomId).subscribe({
      next: (response: StudentModel[]) => {
        this.students.set(response)
        console.log(response)
      }
    })

  }



}
