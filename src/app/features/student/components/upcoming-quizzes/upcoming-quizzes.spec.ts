import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpcomingQuizzes } from './upcoming-quizzes';

describe('UpcomingQuizzes', () => {
  let component: UpcomingQuizzes;
  let fixture: ComponentFixture<UpcomingQuizzes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpcomingQuizzes],
    }).compileComponents();

    fixture = TestBed.createComponent(UpcomingQuizzes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
