import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuizGeneratorHeader } from './quiz-generator-header';

describe('QuizGeneratorHeader', () => {
  let component: QuizGeneratorHeader;
  let fixture: ComponentFixture<QuizGeneratorHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuizGeneratorHeader],
    }).compileComponents();

    fixture = TestBed.createComponent(QuizGeneratorHeader);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
