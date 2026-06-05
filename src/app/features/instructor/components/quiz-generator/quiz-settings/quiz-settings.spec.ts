import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuizSettings } from './quiz-settings';

describe('QuizSettings', () => {
  let component: QuizSettings;
  let fixture: ComponentFixture<QuizSettings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuizSettings],
    }).compileComponents();

    fixture = TestBed.createComponent(QuizSettings);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
