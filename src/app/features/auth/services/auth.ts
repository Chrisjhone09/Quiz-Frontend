import { Injectable, signal } from '@angular/core';
import { LoginModel } from '../interfaces/login.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Field, FieldTree } from '@angular/forms/signals';
import { Observable } from 'rxjs';
import { LoginResponse } from '../interfaces/loginResponse.model';
import { User } from '../interfaces/loginResponse.model';
import { ForgotPasswordModel } from '../interfaces/forgotPassword.model';
import { ResetPasswordModel } from '../interfaces/resetPassword.model';
import { environment } from '../../../../environments/enviroment.developement';
import { RegisterDto } from '../DTOs/register.dto';
import { jwtDecode } from 'jwt-decode';
import { JwtPayloadModel } from '../interfaces/jwtPayload.model';

@Injectable({
  providedIn: 'root',
})
export class Auth {

  constructor(private http: HttpClient) {
  }



  user = signal<User | null>(null)



  login(credentials: LoginModel): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/api/account/login`, credentials);
  }

  register(credentials: RegisterDto): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/account/register`, credentials);
  }

  verifyEmail(data: ResetPasswordModel): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/account/verify-email`, data);
  }

  storeToken(token: string): void {
    localStorage.setItem('authToken', token);

  }

  forgotPassword(email: FieldTree<ForgotPasswordModel>): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/account/forgot-password`, email);
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  logout(): void {
    localStorage.removeItem('authToken');
  }

  storeUserDetails(user: User): void {
    this.user.set(user);
    localStorage.setItem('userId', user.userId);
    localStorage.setItem('username', user.username)
  }

  getUserId(): string {
    const userId = localStorage.getItem('userId');
    return userId ? userId : '';
  }

  getUserName(): string | any {
    const username = localStorage.getItem('username');
    return username ? username : this.user()?.username
  }

  getUserRole(): string | null {
    const token = this.getToken();

    if (!token) {
      return null;
    }

    return jwtDecode<JwtPayloadModel>(token).role;
  }

  getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`
    });
  }
}
