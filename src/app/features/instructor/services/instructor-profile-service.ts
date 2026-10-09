import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Auth } from '../../auth/services/auth';
import { environment } from '../../../../environments/enviroment.developement';
import { ApiResult } from '../interfaces/quizCreation.model';
import {
  ChangePasswordModel,
  InstructorProfileModel,
  UpdateInstructorProfileModel,
} from '../interfaces/instructorProfile.model';

@Injectable({
  providedIn: 'root',
})
export class InstructorProfileService {
  constructor(private http: HttpClient, private authService: Auth) {}

  getProfile() {
    return this.http.get<ApiResult<InstructorProfileModel>>(
      environment.apiUrl + '/api/instructor/profile',
      { headers: this.authService.getAuthHeaders() }
    );
  }

  updateProfile(model: UpdateInstructorProfileModel) {
    return this.http.put<ApiResult<InstructorProfileModel>>(
      environment.apiUrl + '/api/instructor/profile',
      model,
      { headers: this.authService.getAuthHeaders() }
    );
  }

  changePassword(model: ChangePasswordModel) {
    return this.http.post<{ success: boolean; message: string }>(
      environment.apiUrl + '/api/instructor/profile/change-password',
      model,
      { headers: this.authService.getAuthHeaders() }
    );
  }
}
