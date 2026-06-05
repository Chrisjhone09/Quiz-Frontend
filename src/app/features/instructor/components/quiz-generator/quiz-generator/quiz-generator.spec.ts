import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuizGenerator } from './quiz-generator';

describe('QuizGenerator', () => {
  let component: QuizGenerator;
  let fixture: ComponentFixture<QuizGenerator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuizGenerator],
    }).compileComponents();

    fixture = TestBed.createComponent(QuizGenerator);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
