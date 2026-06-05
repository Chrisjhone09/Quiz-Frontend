import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstructorQuizList } from './instructor-quiz-list';

describe('InstructorQuizList', () => {
  let component: InstructorQuizList;
  let fixture: ComponentFixture<InstructorQuizList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstructorQuizList],
    }).compileComponents();

    fixture = TestBed.createComponent(InstructorQuizList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
