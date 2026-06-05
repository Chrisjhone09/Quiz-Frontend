import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiProcessingStep } from './ai-processing-step';

describe('AiProcessingStep', () => {
  let component: AiProcessingStep;
  let fixture: ComponentFixture<AiProcessingStep>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiProcessingStep],
    }).compileComponents();

    fixture = TestBed.createComponent(AiProcessingStep);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
