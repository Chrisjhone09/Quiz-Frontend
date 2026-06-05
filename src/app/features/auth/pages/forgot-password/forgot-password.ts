import { Component, signal } from '@angular/core';
import { email, form, required, FormField, FormRoot } from '@angular/forms/signals';
import { ForgotPasswordModel } from '../../interfaces/forgotPassword.model';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-forgot-password',
  imports: [FormField, FormRoot],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {


  constructor(private authService: Auth){}


  forgotPasswordModel = signal<ForgotPasswordModel>({
    email: ''
  });

  forpasswordForm = form(this.forgotPasswordModel, (shema) => {
    required(shema.email, { message: "Please enter your email address." });
    email(shema.email, { message: "Please enter a valid email address." });
  }, 
  {
    submission: {
      action: async (model) => {
          this.authService.forgotPassword(model).subscribe({
          next: (response) => {
            console.log('Forgot password response:', response);
          },
          error: (error) => {
            console.error('Forgot password error:', error);
          }
        });
      }
    }
  })
}
