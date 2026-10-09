import { describe, expect, it } from 'vitest';
import { DAY_MS, formatPhilippineDate, formatPhilippineDateTime, formatTimeAgo, parseTimestamp, philippineInputValues, scheduleTimestamp } from './philippine-time';

describe('Philippine time', () => {
  const now = Date.parse('2004-07-09T08:00:00Z');

  it('uses a full month, unpadded day and year', () => {
    expect(formatPhilippineDate('2004-07-09')).toBe('July 9 2004');
  });

  it('moves UTC events past midnight to the Philippine calendar day', () => {
    expect(formatPhilippineDateTime('2004-07-08T16:30:00Z')).toBe('July 9 2004 at 12:30 AM PHT');
  });

  it('treats offsetless API event timestamps as UTC', () => {
    expect(parseTimestamp('2004-07-09T05:00:00')?.toISOString()).toBe('2004-07-09T05:00:00.000Z');
    expect(formatTimeAgo('2004-07-09T05:00:00', now)).toBe('3 hours ago');
  });

  it('honors explicit offsets without applying the timezone twice', () => {
    expect(formatPhilippineDateTime('2004-07-09T13:00:00+08:00')).toBe('July 9 2004 at 1:00 PM PHT');
  });

  it('uses relative time until exactly 24 hours have elapsed', () => {
    expect(formatTimeAgo(now - 30_000, now)).toBe('Just now');
    expect(formatTimeAgo(now - 60_000, now)).toBe('1 minute ago');
    expect(formatTimeAgo(now - 3 * 60_000, now)).toBe('3 minutes ago');
    expect(formatTimeAgo(now - 3_600_000, now)).toBe('1 hour ago');
    expect(formatTimeAgo(now - DAY_MS + 1, now)).toBe('23 hours ago');
    expect(formatTimeAgo(now - DAY_MS, now)).toBe('July 8 2004');
  });

  it('shows future events as dates rather than negative relative times', () => {
    expect(formatTimeAgo(now + DAY_MS, now)).toBe('July 10 2004');
  });

  it('keeps date-only values on the selected Philippine day', () => {
    expect(parseTimestamp('2004-07-09')?.toISOString()).toBe('2004-07-08T16:00:00.000Z');
  });

  it('interprets quiz wall-clock schedules in the Philippines', () => {
    expect(scheduleTimestamp('2004-07-09', '09:30:00.000')?.toISOString()).toBe('2004-07-09T01:30:00.000Z');
    expect(formatPhilippineDateTime(scheduleTimestamp('2004-07-09', '09:30'))).toBe('July 9 2004 at 9:30 AM PHT');
  });

  it('creates schedule input values using the Philippine day and clock', () => {
    expect(philippineInputValues(new Date('2004-07-08T16:30:00Z'))).toEqual({ date: '2004-07-09', time: '00:30' });
  });

  it('does not render invalid or missing dates', () => {
    for (const value of [null, undefined, '', 'not-a-date']) {
      expect(formatTimeAgo(value, now)).toBe('');
      expect(formatPhilippineDateTime(value)).toBe('');
    }
  });
});
