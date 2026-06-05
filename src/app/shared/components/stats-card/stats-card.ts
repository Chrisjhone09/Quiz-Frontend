import { Component, input, Input, signal } from '@angular/core';
import { StatsCardModel } from '../../../features/student/interfaces/stats-card.model';

@Component({
  selector: 'app-stats-card',
  imports: [],
  templateUrl: './stats-card.html',
  styleUrl: './stats-card.css',
})
export class StatsCard {

   statsCards =  input<StatsCardModel[] | null>();

}
