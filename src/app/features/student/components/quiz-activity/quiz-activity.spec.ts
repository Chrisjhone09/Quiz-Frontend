import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuizActivity } from './quiz-activity';

describe('QuizActivity', () => {
  let component: QuizActivity;
  let fixture: ComponentFixture<QuizActivity>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuizActivity],
    }).compileComponents();

    fixture = TestBed.createComponent(QuizActivity);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
