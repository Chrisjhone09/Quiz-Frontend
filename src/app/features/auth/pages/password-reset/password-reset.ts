import { Component, OnInit, signal } from '@angular/core';
import { ResetPasswordModel } from '../../interfaces/resetPassword.model';
import { email, form, required, validate, FormField, FormRoot, disabled, hidden } from '@angular/forms/signals';
import { Auth } from '../../services/auth';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-password-reset',
  imports: [FormField, FormRoot],
  templateUrl: './password-reset.html',
  styleUrl: './password-reset.css',
})
export class PasswordReset implements OnInit {

  constructor(private auth: Auth, private route: ActivatedRoute){}
  

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => { 
      this.resetPasswordModel.update(model => {
        return { ...model, token: params['token'] };
      });
    });
  }


  resetPasswordModel = signal<ResetPasswordModel>({
    email: '',
    newPassword: '',
    confirmNewPassword: '',
    token: ''
  });



  resetPasswordForm = form(this.resetPasswordModel, (shema) => {
    disabled(shema.email);
    email(shema.email, { message: "Please enter a valid email address." });
    required(shema.newPassword, { message: "Please enter a valid new password." });
    validate(shema.confirmNewPassword, ({ value, valueOf }) => { value() != valueOf(shema.newPassword) ? 'Passwords do not match.' : true });
  },
  {
    submission: {
      action: async (model) => {
        this.auth.verifyEmail(model().value()).subscribe({
          next: (response) => {
            console.log('Password reset response:', response);
          }
          
        })
      }
    }
  }
)
}
