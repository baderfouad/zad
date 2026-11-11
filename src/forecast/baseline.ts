import type { DayRecord, Occasion, Venue } from '../data/types';
import { addDays, weekdayOfIso } from './dates';

export const WINDOW_DAYS = 28;

export interface GuestSteps {
  typical: number;      // mean guests over the window
  weekday: number;      // weekday mean − typical
  occasion: number;     // (typical + weekday) × (multiplier − 1)
  weather: number;      // change from the weather factor
  trend: number;        // change from venue.trend
  expected: number;     // rounded result
  weatherFactor: number;
  weekdayIndex: number;
  daysUsed: number;
  sameWeekdayDays: number;
}

/** Weather effect on guests: restaurants only. +3% at 20–30°C, −1.2% per degree above 37°C. */
export function weatherFactor(venue: Venue, tempC: number | null): number {
  if (venue.kind !== 'alacarte' || tempC === null || !Number.isFinite(tempC)) return 1;
  if (tempC > 37) return 1 - (tempC - 37) * 0.012;
  if (tempC >= 20 && tempC <= 30) return 1.03;
  return 1;
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);

/** The window of days the baseline learns from: the last 28 days up to and including `today`. */
export function windowOf(history: DayRecord[], today: string, days = WINDOW_DAYS): DayRecord[] {
  const from = addDays(today, -(days - 1));
  return history.filter((h) => h.date >= from && h.date <= today);
}

/**
 * The explainable baseline (see the zad-forecast skill):
 * expected = round((typical + weekday + occasion) × weatherFactor × trend)
 */
export function explainGuests(
  venue: Venue, history: DayRecord[], today: string, target: string, occasion: Occasion, tempC: number | null,
  applyTrend = true,
): GuestSteps {
  const win = windowOf(history, today);
  const typical = mean(win.map((h) => h.guestsActual));
  const wd = weekdayOfIso(target);
  const same = win.filter((h) => h.weekday === wd);
  const weekday = same.length ? mean(same.map((h) => h.guestsActual)) - typical : 0;
  const base = typical + weekday;
  const occ = base * (occasion.guestMultiplier - 1);
  const wf = weatherFactor(venue, tempC);
  const afterWeather = (base + occ) * wf;
  const tr = applyTrend ? venue.trend : 1;
  const raw = afterWeather * tr;
  const expected = Math.round(raw);
  return {
    typical, weekday, occasion: occ,
    weather: afterWeather - (base + occ),
    trend: expected - afterWeather, // absorbs rounding so the steps add up exactly
    expected, weatherFactor: wf, weekdayIndex: wd, daysUsed: win.length, sameWeekdayDays: same.length,
  };
}

export interface WeekDay { date: string; guests: number; lo: number; hi: number; isTomorrow: boolean }

/** Expected guests for the 7 days after `today`. Tomorrow uses the full step chain; later days use weekday × trend. */
export function weekAhead(
  venue: Venue, history: DayRecord[], today: string, tomorrow: GuestSteps, uncertainty: number,
): WeekDay[] {
  const none: Occasion = { id: 'none', guestMultiplier: 1, appetiteMultiplier: 1, usualOverprep: 1, dishAdjustments: {} };
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, i + 1);
    const g = i === 0 ? tomorrow.expected : explainGuests(venue, history, today, date, none, null).expected;
    return { date, guests: g, lo: Math.round(g * (1 - uncertainty)), hi: Math.round(g * (1 + uncertainty)), isTomorrow: i === 0 };
  });
}
