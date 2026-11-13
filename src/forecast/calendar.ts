import type { CalendarEvent } from '../data/types';
import { addDays, dayDiff } from './dates';

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/** The calendar event on a date. When events overlap (Sport Day inside Ramadan), the shortest one wins. */
export function eventOn(cal: CalendarEvent[], date: string): CalendarEvent | null {
  const hits = cal.filter((e) => e.from <= date && date <= e.to);
  if (!hits.length) return null;
  return hits.reduce((a, b) => (dayDiff(b.from, b.to) < dayDiff(a.from, a.to) ? b : a));
}

export interface Upcoming { event: CalendarEvent; startsIn: number; ongoing: boolean; planDate: string }

/** Events that end after `today`, soonest first. `planDate` is the first day of the event that is still ahead. */
export function upcoming(cal: CalendarEvent[], today: string, limit = 5): Upcoming[] {
  const tomorrow = addDays(today, 1);
  return cal
    .filter((e) => e.to >= tomorrow)
    .map((e) => {
      const planDate = e.from > tomorrow ? e.from : tomorrow;
      return { event: e, startsIn: dayDiff(today, planDate), ongoing: e.from <= today, planDate };
    })
    .sort((a, b) => a.planDate.localeCompare(b.planDate) || dayDiff(a.event.from, a.event.to) - dayDiff(b.event.from, b.event.to))
    .slice(0, limit);
}

/** "Friday;Saturday" → [5, 6] */
export function parseWeekend(s: string | undefined): number[] {
  const days = (s ?? 'Friday;Saturday').split(/[;,]/).map((d) => WEEKDAYS.indexOf(d.trim().toLowerCase())).filter((d) => d >= 0);
  return days.length ? days : [5, 6];
}
