import { Component, computed, signal } from '@angular/core';
import { disabled, email, form, FormField, FormRoot, hidden, required, submit } from '@angular/forms/signals';
import { LoginModel } from '../../interfaces/login.model';
import { Auth } from '../../services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [FormField, FormRoot],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {


  constructor(private authService: Auth,
    private router: Router) {
  }

  loginModel = signal<LoginModel>({
    email: '',
    password: ''
  });

  loginForm = form(this.loginModel, (shema) => {
    required(shema.email, { message: "Please enter your email address." });
    email(shema.email, { message: "Please enter a valid email address." });
    required(shema.password, { message: "Please enter a valid password." });
  },
    {
      submission: {
        action: async (model) => {
          this.authService.login(model().value()).subscribe({
            next: (response) => {
              this.authService.storeToken(response.token);
              this.authService.storeUserDetails(response.user);
            
              this.router.navigate([response.endpoint]);
            }
          });

        }
      }
    });

  orderModel = signal({
    total: 25,
    couponCode: '',
  });
  orderForm = form(this.orderModel, (schemaPath) => {
    disabled(schemaPath.couponCode, ({ valueOf }) =>
      valueOf(schemaPath.total) < 50 ? 'Order must be $50 or more to use a coupon' : true,
    );
  });
}


