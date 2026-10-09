import { Component, signal } from '@angular/core';
import { email, form, required, FormField, FormRoot } from '@angular/forms/signals';
import { ForgotPasswordModel } from '../../interfaces/forgotPassword.model';
import { Auth } from '../../services/auth';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  imports: [FormField, FormRoot, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {


  constructor(private authService: Auth, private router: Router){}

  readonly submitting = signal(false);
  readonly errorMessage = signal('');

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
          this.submitting.set(true);
          this.errorMessage.set('');
          const emailAddress = model().value().email;

          this.authService.forgotPassword(emailAddress).subscribe({
          next: (response) => {
            this.submitting.set(false);
            this.router.navigate(['/reset-password'], {
              queryParams: { email: emailAddress },
              state: { message: response.message }
            });
          },
          error: (error) => {
            this.submitting.set(false);
            this.errorMessage.set(error?.error?.message ?? 'We could not send a reset code. Please try again.');
          }
        });
      }
    }
  })
}
