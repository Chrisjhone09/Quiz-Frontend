import { Component, signal } from '@angular/core';
import { email, form, required, validate, FormField, FormRoot } from '@angular/forms/signals';
import { Auth } from '../../services/auth';
import { RegisterDto } from '../../DTOs/register.dto';
import { RegisterModel, RegisterRole } from '../../interfaces/register.model';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [FormField, FormRoot, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {

  constructor(private auth: Auth) {

  }

  readonly submitting = signal(false);
  readonly successMessage = signal('');
  readonly errorMessage = signal('');

  registerModel = signal<RegisterModel>({
    role: 'Student',
    fname: '',
    lname: '',
    email: '',
    password: '',
    confirmPassword: '',
    studentId: '',
    section: '',
    middleName: ''
  });

  /**
   * Student ID and Section only apply to students, so they are hidden and
   * skipped by validation when registering as an instructor.
   */
  selectRole(role: RegisterRole): void {
    this.registerModel.update((model) => ({ ...model, role }));
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  isStudent(): boolean {
    return this.registerModel().role === 'Student';
  }

  /** The API replies with { message }, but falls back to a bare string on some paths. */
  private readMessage(body: unknown, fallback: string): string {
    if (typeof body === 'string' && body.trim()) {
      return body;
    }

    const message = (body as { message?: string } | null)?.message;
    return message?.trim() ? message : fallback;
  }

  registerForm = form(this.registerModel, (shema) => {
    required(shema.fname, { message: "Please enter your first name." });
    required(shema.lname, { message: "Please enter your last name." });
    email(shema.email, { message: "Please enter a valid email address." });
    required(shema.password, { message: "Please enter a valid password." });
    validate(shema.confirmPassword, ({ value, valueOf }) =>
      value() !== valueOf(shema.password) ? { kind: 'mismatch', message: 'Passwords do not match.' } : null);
    validate(shema.studentId, ({ value, valueOf }) =>
      valueOf(shema.role) === 'Student' && !value().trim()
        ? { kind: 'required', message: 'Please enter your student ID.' }
        : null);
    validate(shema.section, ({ value, valueOf }) =>
      valueOf(shema.role) === 'Student' && !value().trim()
        ? { kind: 'required', message: 'Please enter your section.' }
        : null);
  },
    {
      submission: {
        action: async (model) => {
          const value = model().value();
          const isStudent = value.role === 'Student';

          const payload: RegisterDto = {
            role: value.role,
            studentId: isStudent ? value.studentId : null,
            section: isStudent ? value.section.toUpperCase() : null,
            firstName: value.fname.charAt(0).toUpperCase() + value.fname.slice(1).toLowerCase(),
            middleName: value.middleName
              ? value.middleName.charAt(0).toUpperCase() + value.middleName.slice(1).toLowerCase()
              : null,
            lastName: value.lname.toUpperCase(),
            email: value.email,
            password: value.password,
          }

          this.submitting.set(true);
          this.successMessage.set('');
          this.errorMessage.set('');

          this.auth.register(payload).subscribe({
            next: (response) => {
              this.submitting.set(false);
              // For students this message is the "waiting for administrator approval"
              // notice, which is the whole point of surfacing it rather than silently
              // succeeding.
              this.successMessage.set(
                this.readMessage(response,
                  'Registration received. An administrator will review your account before you can sign in.')
              );
            },
            error: (error) => {
              this.submitting.set(false);
              this.errorMessage.set(
                this.readMessage(error?.error,
                  'Registration failed. Please check your details and try again.')
              );
            }
          });
        }
      }
    }
  )

}
