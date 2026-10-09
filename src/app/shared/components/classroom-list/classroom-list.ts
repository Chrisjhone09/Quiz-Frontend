import { Component, input, Input, output, Output, signal } from '@angular/core';
import { ClassroomModel } from '../../interfaces/classrooms.model';
import { RouterLink } from '@angular/router';
import {JsonPipe} from '@angular/common';
import { Auth } from '../../../features/auth/services/auth';
import { StudentClassroomService } from '../../../features/student/services/student-classroom-service';

@Component({
  selector: 'app-classroom-list',
  templateUrl: './classroom-list.html',
  styleUrls: ['./classroom-list.css'],
  imports: [RouterLink]
})
export class ClassroomList {

 classrooms = input<ClassroomModel[]>([]);

  updateClassroom=output<string>();


  

constructor(private classroomService : StudentClassroomService, public auth: Auth){}

  /** Quizzes in this classroom the student still has something to do for —
   * mirrors the dashboard's "Pending Quizzes" stat, just scoped to one classroom. */
  activeCount(classroom: ClassroomModel): number {
    return (classroom.quizzes ?? []).filter((q) => q.status !== 'Completed').length;
  }

}
