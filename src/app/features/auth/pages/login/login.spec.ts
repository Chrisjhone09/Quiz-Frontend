import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Auth } from '../../services/auth';

import { Login } from './login';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), { provide: Auth, useValue: {} }],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('displays the department logo and branding', () => {
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('img')?.getAttribute('src')).toBe('itLogo.png');
    expect(element.querySelector('img')?.getAttribute('alt')).toContain('Information Technology Education');
    expect(element.textContent).toContain('Information Technology Education');
    expect(element.textContent).not.toContain('Quiz AI');
  });

  it('has a visible sign-up link and password recovery link', () => {
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('a[href="/register"]')?.textContent?.trim()).toBe('Sign up');
    expect(element.querySelector('a[href="/forgot-password"]')).not.toBeNull();
    expect(element.querySelector('button[type="submit"]')?.textContent?.trim()).toBe('Sign in');
  });

  it('keeps the submit button present while signing in', async () => {
    component.submitting.set(true);
    await fixture.whenStable();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(button.disabled).toBe(true);
    expect(button.textContent?.trim()).toBe('Signing in...');
  });
});
