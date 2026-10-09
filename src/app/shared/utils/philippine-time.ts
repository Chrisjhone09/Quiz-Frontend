export const PHILIPPINE_TIME_ZONE = 'Asia/Manila';
export const DAY_MS = 24 * 60 * 60 * 1000;
export type DateValue = string | number | Date | null | undefined;

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: PHILIPPINE_TIME_ZONE, month: 'long', day: 'numeric', year: 'numeric',
});
const timeFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: PHILIPPINE_TIME_ZONE, hour: 'numeric', minute: '2-digit', hour12: true,
});
const inputFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: PHILIPPINE_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

export function parseTimestamp(value: DateValue): Date | null {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const text = value.trim();
  // Calendar dates are Philippine dates; unqualified API timestamps are UTC
  // (SQL Server does not preserve DateTime.Kind when reading an event back).
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(text)
    ? `${text}T00:00:00+08:00`
    : /^\d{4}-\d{2}-\d{2}T/.test(text) && !/(Z|[+-]\d{2}:?\d{2})$/i.test(text)
      ? `${text}Z`
      : text;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function scheduleTimestamp(date?: string | null, time?: string | null): Date | null {
  if (!date) return null;
  const clock = time?.split('.')[0] || '00:00:00';
  return parseTimestamp(`${date}T${clock}+08:00`);
}

export function formatPhilippineDate(value: DateValue): string {
  const date = parseTimestamp(value);
  if (!date) return '';
  const parts = dateFormatter.formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value;
  return `${part('month')} ${part('day')} ${part('year')}`;
}

export function formatPhilippineTime(value: DateValue): string {
  const date = parseTimestamp(value);
  return date ? timeFormatter.format(date) : '';
}

export function formatPhilippineDateTime(value: DateValue): string {
  const date = formatPhilippineDate(value);
  return date ? `${date} at ${formatPhilippineTime(value)} PHT` : '';
}

export function formatTimeAgo(value: DateValue, now = Date.now()): string {
  const date = parseTimestamp(value);
  if (!date) return '';
  const elapsed = now - date.getTime();
  if (elapsed < 0 || elapsed >= DAY_MS) return formatPhilippineDate(date);
  if (elapsed < 60_000) return 'Just now';
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours} hour${hours === 1 ? '' : 's'} ago`;
}

export function philippineInputValues(value = new Date()): { date: string; time: string } {
  const parts = inputFormatter.formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value;
  return { date: `${part('year')}-${part('month')}-${part('day')}`, time: `${part('hour')}:${part('minute')}` };
}
