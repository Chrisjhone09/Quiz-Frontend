import { Component, OnInit, signal } from '@angular/core';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { LoginModel } from '../../interfaces/login.model';
import { Auth } from '../../services/auth';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [FormField, FormRoot, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {


  constructor(private authService: Auth,
    private router: Router) {
  }

  readonly submitting = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  ngOnInit(): void {
    this.successMessage.set(history.state?.message ?? '');
  }

  loginModel = signal<LoginModel>({
    email: '',
    password: ''
  });

  loginForm = form(this.loginModel, (shema) => {
    required(shema.email, { message: "Please enter your email address or student ID." });
    required(shema.password, { message: "Please enter a valid password." });
  },
    {
      submission: {
        action: async (model) => {
          this.submitting.set(true);
          this.errorMessage.set('');

          this.authService.login(model().value()).subscribe({
            next: (response) => {
              this.submitting.set(false);
              this.authService.storeToken(response.token);
              this.authService.storeUserDetails(response.user);

              this.router.navigate([response.endpoint]);
            },
            error: (error) => {
              this.submitting.set(false);
              // Carries the server's reason verbatim, which is how a student learns
              // their account is still waiting on administrator approval.
              const body = error?.error;
              const message = typeof body === 'string' && body.trim()
                ? body
                : (body as { message?: string } | null)?.message;

              this.errorMessage.set(
                message?.trim() ? message : 'Unable to sign in. Please try again.'
              );
            }
          });
        }
      }
    });
}
