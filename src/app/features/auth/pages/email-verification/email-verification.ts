import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Auth } from '../../services/auth';

type VerificationStatus = 'verifying' | 'success' | 'error';

@Component({
  selector: 'app-email-verification',
  imports: [RouterLink],
  templateUrl: './email-verification.html',
  styleUrl: './email-verification.css',
})
export class EmailVerification implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(Auth);

  readonly status = signal<VerificationStatus>('verifying');
  readonly message = signal('Verifying your email address…');

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const email = params.get('email');
    const token = params.get('token');

    if (!email || !token) {
      this.status.set('error');
      this.message.set(
        'This verification link is missing information. Please use the exact link from your email, or request a new one by trying to sign in.'
      );
      return;
    }

    this.auth.confirmEmailVerification(email, token).subscribe({
      next: (response) => {
        this.status.set('success');
        this.message.set(
          this.readMessage(response) ??
            'Email verified. Your account is now waiting for administrator approval.'
        );
      },
      error: (error) => {
        this.status.set('error');
        this.message.set(
          this.readMessage(error?.error) ??
            'This link is invalid or has expired. Please try registering again, or contact your administrator.'
        );
      },
    });
  }

  /** The API returns a bare string for this endpoint, but guard for an object shape too. */
  private readMessage(body: unknown): string | null {
    if (typeof body === 'string' && body.trim()) {
      return body;
    }

    const message = (body as { message?: string })?.message;
    return message?.trim() ? message : null;
  }
}
