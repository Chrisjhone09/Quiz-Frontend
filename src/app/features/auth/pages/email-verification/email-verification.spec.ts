import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailVerification } from './email-verification';

describe('EmailVerification', () => {
  let component: EmailVerification;
  let fixture: ComponentFixture<EmailVerification>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmailVerification],
    }).compileComponents();

    fixture = TestBed.createComponent(EmailVerification);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
