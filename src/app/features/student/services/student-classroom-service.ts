import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/enviroment.developement';
import { JoinClassroomDto } from '../interfaces/joinclassroom.model';
import { Auth } from '../../auth/services/auth';

@Injectable({
  providedIn: 'root',
})
export class StudentClassroomService {
  constructor(private http: HttpClient, private authService : Auth) { }

  fetchAllClassrooms(): Observable<any> {
    return this.http.get(environment.apiUrl + '/api/student-classroom/get-classrooms/' + this.authService.getUserId());
  
  }

  joinClassroom(joinClassroomDto: JoinClassroomDto): Observable<any> {
    return this.http.post(environment.apiUrl + '/api/student-classroom/join-classroom', joinClassroomDto);
  }

  getClassroomById(id: string){
    return this.http.get(environment.apiUrl + '/api/student-classroom/get-classroom/' + id);
  }

  leaveClassroom(classroomId : string) {
    return this.http.delete(environment.apiUrl + '/api/student-classroom/leave-classroom', {
      body: {
        userId : this.authService.getUserId(),
        classroomId
      }
    })
  }
}
