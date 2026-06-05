import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReviewEditStep } from './review-edit-step';

describe('ReviewEditStep', () => {
  let component: ReviewEditStep;
  let fixture: ComponentFixture<ReviewEditStep>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewEditStep],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewEditStep);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
