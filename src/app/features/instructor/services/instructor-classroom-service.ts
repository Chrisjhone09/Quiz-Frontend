import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Auth } from '../../auth/services/auth';
import { environment } from '../../../../environments/enviroment.developement';
import { Header } from '../../../shared/header/header';
import { ClassroomModel } from '../../../shared/interfaces/classrooms.model';
import { ClassroomCreationModel } from '../../../shared/interfaces/classroomCreation.model';
import { StudentModel } from '../../../shared/interfaces/student.model';
import { QuizModel } from '../../student/interfaces/quiz.model';


@Injectable({
  providedIn: 'root',
})
export class InstructorClassroomService {

 baseHeaders = new HttpHeaders();

  constructor(private http: HttpClient, private authService : Auth){}

  getClassrooms(){
    return this.http.get<ClassroomModel[]>(environment.apiUrl+"/api/instructor-classroom/get-classroom", {
      headers: this.authService.getAuthHeaders()
    })
  }

  leaveClassroom(classroomId : string) {
    return this.http.delete(environment.apiUrl+ "/api/instructor-classroom/leave-classroom/" + classroomId, {
      headers: this.authService.getAuthHeaders()
    })
  }

  updateClassroom(classroomId : string) {
    
  }

  createClassrooom(model : ClassroomCreationModel) {
    return this.http.post<ClassroomModel>(environment.apiUrl+"/api/instructor-classroom/create-classroom", model, {
      headers: this.authService.getAuthHeaders()
    })
  }

  getClassroom(classroomId: string){
    return this.http.get<ClassroomModel>(environment.apiUrl+ "/api/instructor-classroom/classroom/"+classroomId)
  }

  getStudentList(classroomId : string | null | undefined){
    return this.http.get<StudentModel[]>(environment.apiUrl+"/api/instructor-classroom/"+classroomId+"/students-list")
  }

  getQuizzes(classroomId:string | null | undefined){
    return this.http.get<QuizModel[]>(environment.apiUrl+"/api/instructor-classroom/"+classroomId+"/quizzes");
  }

}
