import { Component, HostListener, OnInit, signal } from '@angular/core';
import { email, form, required, validate, FormField, FormRoot } from '@angular/forms/signals';
import { Auth } from '../../services/auth';
import { RegisterDto } from '../../DTOs/register.dto';

@Component({
  selector: 'app-register',
  imports: [FormField, FormRoot],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {

  constructor(private auth: Auth) {

  }

  registerModel = signal<RegisterModel>({
    fname: '',
    lname: '',
    email: '',
    password: '',
    confirmPassword: '',
    studentId: '',
    section: '',
    middleName: ''
  });


  registerForm = form(this.registerModel, (shema) => {
    required(shema.fname, { message: "Please enter your first name." });
    required(shema.lname, { message: "Please enter your last name." });
    email(shema.email, { message: "Please enter a valid email address." });
    required(shema.password, { message: "Please enter a valid password." });
    validate(shema.confirmPassword, ({ value, valueOf }) => { value() != valueOf(shema.password) ? 'Passwords do not match.' : true });
    required(shema.studentId, { message: "Please enter your student ID." });
    required(shema.section, { message: "Please enter your section." });
  },
    {
      submission: {
        action: async (model) => {

          const payload: RegisterDto = {
            studentId: model().value().studentId,
            firstName: model().value().fname.charAt(0).toUpperCase() + model().value().fname.slice(1).toLowerCase(),
            middleName: model().value().middleName ? model().value().middleName.charAt(0).toUpperCase() + model().value().middleName.slice(1).toLowerCase() : null,
            lastName: model().value().lname.toUpperCase(),
            section: model().value().section.toUpperCase(),
            email: model().value().email,
            password: model().value().password,

          }

          this.auth.register(payload).subscribe({
            next: (response) => {
              console.log('Registration successful:', response);
            },
            error: (error) => {
              console.error('Registration failed:', error);
            }
          });


        }
      }
    }
  )

}
