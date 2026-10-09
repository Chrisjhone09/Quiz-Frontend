import { Component, OnInit, signal } from '@angular/core';
import { FormField, FormRoot, form, required, validate } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Auth } from '../../services/auth';
import { ResetPasswordModel } from '../../interfaces/resetPassword.model';

@Component({
  selector: 'app-password-reset',
  imports: [FormField, FormRoot, RouterLink],
  templateUrl: './password-reset.html',
  styleUrl: './password-reset.css',
})
export class PasswordReset implements OnInit {
  constructor(private auth: Auth, private route: ActivatedRoute, private router: Router) {}

  readonly submitting = signal(false);
  readonly errorMessage = signal('');
  readonly sentMessage = signal('');

  resetPasswordModel = signal<ResetPasswordModel>({
    email: '',
    code: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  ngOnInit(): void {
    const email = this.route.snapshot.queryParamMap.get('email') ?? '';
    this.resetPasswordModel.update((model) => ({ ...model, email }));
    this.sentMessage.set(history.state?.message ?? 'Enter the six-digit code we sent to your email.');
  }

  resetPasswordForm = form(this.resetPasswordModel, (schema) => {
    required(schema.code, { message: 'Enter the 6-digit code from your email.' });
    validate(schema.code, ({ value }) => /^\d{6}$/.test(value())
      ? null
      : { kind: 'code', message: 'The code must contain exactly 6 digits.' });
    required(schema.newPassword, { message: 'Please create a new password.' });
    validate(schema.confirmNewPassword, ({ value, valueOf }) => value() === valueOf(schema.newPassword)
      ? null
      : { kind: 'mismatch', message: 'Passwords do not match.' });
  }, {
    submission: {
      action: async (model) => {
        const value = model().value();
        this.submitting.set(true);
        this.errorMessage.set('');

        this.auth.resetPassword(value).subscribe({
          next: () => {
            this.submitting.set(false);
            this.router.navigate(['/login'], { state: { message: 'Password updated. You can sign in now.' } });
          },
          error: (error) => {
            this.submitting.set(false);
            this.errorMessage.set(error?.error?.message ?? error?.error ?? 'We could not update your password. Try again.');
          },
        });
      },
    },
  });
}
