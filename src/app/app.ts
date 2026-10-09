import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NetworkLoading } from './shared/components/network-loading/network-loading';
import { Login } from './features/auth/pages/login/login';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NetworkLoading],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {}
