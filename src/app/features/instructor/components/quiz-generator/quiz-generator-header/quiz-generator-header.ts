import { Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-quiz-generator-header',
  imports: [RouterLink],
  templateUrl: './quiz-generator-header.html',
  styleUrl: './quiz-generator-header.css',
})
export class QuizGeneratorHeader {
  private readonly router = inject(Router);

  readonly steps = [
    { label: 'Upload Syllabus', path: '/quiz-generator' },
    { label: 'Review & Edit', path: '/quiz-generator/review' },
    { label: 'Publish', path: '/quiz-generator/publish' },
  ];

  private readonly routeEvent = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      startWith(null),
    ),
  );

  readonly activeIndex = computed(() => {
    this.routeEvent();
    const currentUrl = this.router.url;
    const index = this.steps.findIndex((step) => currentUrl.includes(step.path));

    return index >= 0 ? index : 0;
  });

  isCompleted(index: number): boolean {
    return index < this.activeIndex();
  }

  isActive(index: number): boolean {
    return index === this.activeIndex();
  }
}
