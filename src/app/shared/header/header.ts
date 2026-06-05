import { Component } from '@angular/core';
import { Auth } from '../../features/auth/services/auth';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {

constructor(public authService: Auth) {
}

}
