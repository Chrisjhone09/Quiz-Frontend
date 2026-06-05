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
  leaveClassroom = output<string>();

  updateClassroom=output<string>();


  

constructor(private classroomService : StudentClassroomService, public auth: Auth){}


}