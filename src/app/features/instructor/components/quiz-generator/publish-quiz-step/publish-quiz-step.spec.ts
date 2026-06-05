import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublishQuizStep } from './publish-quiz-step';

describe('PublishQuizStep', () => {
  let component: PublishQuizStep;
  let fixture: ComponentFixture<PublishQuizStep>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublishQuizStep],
    }).compileComponents();

    fixture = TestBed.createComponent(PublishQuizStep);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
