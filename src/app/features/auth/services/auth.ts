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

  resetPassword(data: ResetPasswordModel): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/api/account/reset-password`, data);
  }

  /**
   * Confirms a newly-registered account's email address (the link sent by
   * RegisterAsync). The API reads email/token from the query string regardless
   * of verb, so this is a POST with no body — kept separate from verifyEmail()
   * above, which is actually used by the password-reset form for a different
   * endpoint/payload shape.
   */
  confirmEmailVerification(email: string, token: string): Observable<any> {
    const params = `email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
    return this.http.post(`${environment.apiUrl}/api/account/verify-email?${params}`, {});
  }

  storeToken(token: string): void {
    localStorage.setItem('authToken', token);

  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${environment.apiUrl}/api/account/send-reset-code`,
      {},
      { params: { email } }
    );
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  logout(): void {
    // Best-effort audit-trail write ("who logged out, and when") — fired before the
    // token is cleared since the call needs it, but never awaited: the client wipes
    // its own state immediately regardless of whether the request reaches the server.
    const token = this.getToken();

    if (token) {
      this.http
        .post(`${environment.apiUrl}/api/account/logout`, {}, { headers: this.getAuthHeaders() })
        .subscribe({ next: () => {}, error: () => {} });
    }

    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    this.user.set(null);
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

    try {
      return jwtDecode<JwtPayloadModel>(token).role ?? null;
    } catch {
      return null;
    }
  }

  getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`
    });
  }
}
