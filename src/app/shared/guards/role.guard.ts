import { inject } from '@angular/core';
import { CanActivateFn, RedirectFunction, Router } from '@angular/router';
import { Auth } from '../../features/auth/services/auth';

/**
 * Where to send someone the guard just blocked. Not logged in at all → the
 * login page. Logged in but wrong role for this route (e.g. a Student hitting
 * an instructor URL directly) → their own dashboard rather than /login, since
 * bouncing an already-valid session back to the sign-in screen is confusing —
 * they're not unauthenticated, they're just in the wrong place.
 */
function dashboardFor(role: string | null): string {
  switch (role) {
    case 'Admin':
      return '/admin-dashboard';
    case 'Instructor':
      return '/instructor-dashboard';
    case 'Student':
      return '/student-dashboard';
    default:
      return '/login';
  }
}

export const sessionRedirect: RedirectFunction = () =>
  dashboardFor(inject(Auth).getUserRole());

export const loginGuard: CanActivateFn = () => {
  const destination = dashboardFor(inject(Auth).getUserRole());
  return destination === '/login' ? true : inject(Router).createUrlTree([destination]);
};

/**
 * Builds a CanActivateFn that only lets the listed roles through. Shared
 * factory behind the three per-role guards below so the three stay in sync —
 * add a role, fix a redirect, it happens once.
 */
function roleGuard(allowedRoles: string[]): CanActivateFn {
  return () => {
    const auth = inject(Auth);
    const router = inject(Router);

    const token = auth.getToken();
    if (!token) {
      return router.createUrlTree(['/login']);
    }

    const role = auth.getUserRole();
    if (!role || !allowedRoles.includes(role)) {
      return router.createUrlTree([dashboardFor(role)]);
    }

    return true;
  };
}

/** Guards every /student-* route — Students only. */
export const studentGuard: CanActivateFn = roleGuard(['Student']);

/** Guards every /instructor-* and /quiz-* (builder/generator) route — Instructors only. */
export const instructorGuard: CanActivateFn = roleGuard(['Instructor']);

/** Guards /admin-dashboard — Admins only. */
export const adminGuard: CanActivateFn = roleGuard(['Admin']);
