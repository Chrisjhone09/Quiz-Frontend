import { ChangeDetectorRef, OnDestroy, Pipe, PipeTransform, inject } from '@angular/core';
import { DateValue, formatTimeAgo } from '../utils/philippine-time';

/**
 * Formats a timestamp the way most social/activity feeds do: "just now", "5 minutes
 * ago", "2 hours ago" for anything within the last 24 hours, and falls back to an
 * absolute date once a full day has passed — so nothing ever reads as "31 days ago".
 *
 * Impure (not `pure: true`) on purpose: a plain pipe only re-runs when its input
 * reference changes, so "5 minutes ago" would freeze at whatever it said on first
 * render. Marking it impure lets it recompute on every change-detection pass instead,
 * which is what makes it keep advancing while the page stays open.
 */
@Pipe({
  name: 'timeAgo',
  standalone: true,
  pure: false,
})
export class TimeAgoPipe implements PipeTransform, OnDestroy {
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly timer = setInterval(() => this.changeDetector.markForCheck(), 30_000);

  transform(value: DateValue): string {
    return formatTimeAgo(value);
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }
}
