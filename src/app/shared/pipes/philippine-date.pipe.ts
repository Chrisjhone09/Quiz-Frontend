import { Pipe, PipeTransform } from '@angular/core';
import { DateValue, formatPhilippineDate, formatPhilippineDateTime, formatPhilippineTime, scheduleTimestamp } from '../utils/philippine-time';

@Pipe({ name: 'philippineDate', standalone: true })
export class PhilippineDatePipe implements PipeTransform {
  transform(value: DateValue, mode: 'date' | 'datetime' | 'time' = 'date', time?: string | null): string {
    if (mode === 'datetime' && !time && typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return formatPhilippineDate(value);
    }
    const timestamp = time && typeof value === 'string' ? scheduleTimestamp(value, time) : value;
    return mode === 'datetime' ? formatPhilippineDateTime(timestamp)
      : mode === 'time' ? formatPhilippineTime(timestamp) : formatPhilippineDate(timestamp);
  }
}
