import { Component } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter, Router, RouterOutlet, Routes } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { routes } from './app.routes';
import { Auth } from './features/auth/services/auth';
import { InstructorDashboard } from './features/instructor/pages/instructor-dashboard/instructor-dashboard';
import { InstructorClassroomService } from './features/instructor/services/instructor-classroom-service';
import { StudentDashboard } from './features/student/pages/student-dashboard/student-dashboard';
import { StudentClassroomService } from './features/student/services/student-classroom-service';

@Component({ imports: [RouterOutlet], template: '<router-outlet />' })
class TestPage {}

// Keep the production paths, redirects and guards, without fetching page data.
function routingOnly(config: Routes): Routes {
  return config.map(({ component, loadComponent, children, ...route }) => ({
    ...route,
    ...(component || loadComponent ? { component: TestPage } : {}),
    ...(children ? { children: routingOnly(children) } : {}),
  }));
}

function tokenFor(role: string): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ sub: 'test-user', role, exp: 4102444800 }));
  return `${header}.${payload}.test-signature`;
}

describe('Session-aware navigation', () => {
  let token: string | null;
  let router: Router;
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    token = null;
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideRouter(routingOnly(routes))],
    });
    vi.spyOn(TestBed.inject(Auth), 'getToken').mockImplementation(() => token);
    router = TestBed.inject(Router);
    harness = await RouterTestingHarness.create();
  });

  for (const [role, dashboard] of [
    ['Student', '/student-dashboard'],
    ['Instructor', '/instructor-dashboard'],
    ['Admin', '/admin-dashboard'],
  ]) {
    for (const url of ['/', '/not-a-real-page', '/instructor-classroom/123/unknown', '/login']) {
      it(`keeps a signed-in ${role} on their dashboard from ${url}`, async () => {
        token = tokenFor(role);
        await harness.navigateByUrl(url);
        expect(router.url).toBe(dashboard);
        expect(token).toBe(tokenFor(role));
      });
    }
  }

  for (const url of ['/', '/not-a-real-page', '/student-dashboard', '/login']) {
    it(`sends a signed-out visitor to login from ${url}`, async () => {
      await harness.navigateByUrl(url);
      expect(router.url).toBe('/login');
    });
  }

  it('returns a signed-in student to their dashboard for an instructor-only route', async () => {
    token = tokenFor('Student');
    await harness.navigateByUrl('/instructor-settings');
    expect(router.url).toBe('/student-dashboard');
  });

  it('allows login after the session has been cleared', async () => {
    token = tokenFor('Student');
    await harness.navigateByUrl('/student-dashboard');
    token = null;
    await harness.navigateByUrl('/login');
    expect(router.url).toBe('/login');
  });

  it('handles a malformed stored token without a navigation error', async () => {
    token = 'not-a-jwt';
    await harness.navigateByUrl('/not-a-real-page');
    expect(router.url).toBe('/login');
  });

  it('handles an unrecognized role without a redirect loop', async () => {
    token = tokenFor('Unknown');
    await harness.navigateByUrl('/not-a-real-page');
    expect(router.url).toBe('/login');
  });

  it('keeps password recovery and email verification available', async () => {
    token = tokenFor('Student');
    for (const url of ['/forgot-password', '/reset-password', '/verify-email']) {
      await harness.navigateByUrl(url);
      expect(router.url).toBe(url);
    }
  });
});

describe('Dashboard section navigation', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'student-dashboard', component: StudentDashboard },
          { path: 'instructor-dashboard', component: InstructorDashboard },
        ]),
        { provide: Auth, useValue: {
          getUserName: () => 'Test User', getUserRole: () => 'Student',
        } },
        { provide: StudentClassroomService, useValue: { fetchAllClassrooms: () => of([]) } },
        { provide: InstructorClassroomService, useValue: { getClassrooms: () => of([]) } },
        { provide: MatDialog, useValue: {} },
      ],
    });
  });

  for (const [dashboard, fragments] of [
    ['/student-dashboard', ['enrolled-classrooms', 'upcoming-quizzes-panel', 'results-history']],
    ['/instructor-dashboard', ['my-classrooms', 'recent-activity']],
  ] as const) {
    it(`keeps section links within ${dashboard}`, async () => {
      const harness = await RouterTestingHarness.create(dashboard);
      const element = harness.routeNativeElement!;
      for (const fragment of fragments) {
        const link = element.querySelector<HTMLAnchorElement>(`a[href="${dashboard}#${fragment}"]`);
        expect(link).not.toBeNull();
        expect(element.querySelector(`#${fragment}`)).not.toBeNull();
        link!.click();
        await harness.fixture.whenStable();
        expect(TestBed.inject(Router).url).toBe(`${dashboard}#${fragment}`);
      }
      expect(element.querySelector('a[href^="#"]')).toBeNull();
    });
  }
});
