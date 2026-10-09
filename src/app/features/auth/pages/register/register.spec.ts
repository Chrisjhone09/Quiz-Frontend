import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Auth } from '../../services/auth';

import { Register } from './register';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [provideRouter([]), { provide: Auth, useValue: {} }],
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('displays the department logo and a sign-up submit button', () => {
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('img')?.getAttribute('src')).toBe('itLogo.png');
    expect(element.textContent).toContain('Information Technology Education');
    expect(element.textContent).not.toContain('Quiz AI');
    expect(element.querySelector('button[type="submit"]')?.textContent?.trim()).toBe('Sign up');
    expect(element.querySelector('a[href="/login"]')?.textContent?.trim()).toBe('Sign in');
  });

  it('keeps the submit button visible while creating an account', async () => {
    component.submitting.set(true);
    await fixture.whenStable();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(button.disabled).toBe(true);
    expect(button.textContent?.trim()).toBe('Creating account...');
  });

  it('preserves student and instructor registration fields', async () => {
    expect(fixture.nativeElement.querySelector('input[placeholder="Student ID"]')).not.toBeNull();
    component.selectRole('Instructor');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('input[placeholder="Student ID"]')).toBeNull();
    const buttons = fixture.nativeElement.querySelectorAll('.role-option');
    expect(buttons[0].getAttribute('aria-pressed')).toBe('false');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
  });

  it('does not show validation errors before the user touches the fields', () => {
    expect(fixture.nativeElement.querySelector('.error')).toBeNull();
  });
});
