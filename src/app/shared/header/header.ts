import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../features/auth/services/auth';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {

constructor(public authService: Auth, private router: Router) {
}

/** Present on every page (this header is global), so it doubles as the one place
 * a logout button reaches every role — instructor, student, and admin. */
isLoggedIn(): boolean {
  return !!this.authService.getToken();
}

logout(): void {
  this.authService.logout();
  this.router.navigate(['/login']);
}

}
