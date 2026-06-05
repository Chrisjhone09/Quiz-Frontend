import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadSyllabusStep } from './upload-syllabus-step';

describe('UploadSyllabusStep', () => {
  let component: UploadSyllabusStep;
  let fixture: ComponentFixture<UploadSyllabusStep>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadSyllabusStep],
    }).compileComponents();

    fixture = TestBed.createComponent(UploadSyllabusStep);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
