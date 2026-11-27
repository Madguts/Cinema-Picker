import { twMerge } from 'tailwind-merge';

import { clsx, type ClassValue } from 'clsx';

export function getLisburnDate(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value;
  const year = part('year');
  const month = part('month');
  const day = part('day');

  if (!year || !month || !day) {
    throw new Error('Could not determine the current date in Europe/London');
  }

  return `${year}-${month}-${day}`;
}

export function getLisburnTime(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value;
  const hour = part('hour');
  const minute = part('minute');

  if (!hour || !minute) {
    throw new Error('Could not determine the current time in Europe/London');
  }

  return `${hour}:${minute}`;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
