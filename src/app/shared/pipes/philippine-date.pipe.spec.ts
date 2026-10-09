import { describe, expect, it } from 'vitest';
import { PhilippineDatePipe } from './philippine-date.pipe';

describe('Philippine date pipe', () => {
  const pipe = new PhilippineDatePipe();

  it('shows a calendar date without inventing a midnight deadline', () => {
    expect(pipe.transform('2004-07-09', 'datetime', null)).toBe('July 9 2004');
  });

  it('combines schedule dates and times in PHT', () => {
    expect(pipe.transform('2004-07-09', 'datetime', '13:00:00')).toBe('July 9 2004 at 1:00 PM PHT');
    expect(pipe.transform('2004-07-09T05:00:00Z', 'datetime')).toBe('July 9 2004 at 1:00 PM PHT');
  });
});
