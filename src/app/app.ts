import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Login } from './features/auth/pages/login/login';
import { Header } from './shared/header/header';
import { SideNav } from './shared/side-nav/side-nav';
import { Auth } from './features/auth/services/auth';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, SideNav],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {

constructor(public authService: Auth)
 {

  }

}
  