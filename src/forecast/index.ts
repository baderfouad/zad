import { numSetting } from '../data/parse';
import { funnel, loggedAccuracy, savings, wasteRate, wasteSources } from '../data/derive';
import type { Occasion, ZadData } from '../data/types';
import { explainGuests, weekAhead } from './baseline';
import { eventOn, parseWeekend, upcoming } from './calendar';
import { setting } from '../data/parse';
import { addDays } from './dates';
import { planDishes, sum, uncertainty } from './dishes';
import { backtest, fitModel, predictModel } from './regression';

export * from './baseline';
export * from './calendar';
export * from './dates';
export * from './dishes';
export * from './regression';

export interface Scenario {
  occasion: string | null; // null = take it from Qatar's calendar
  guests: number | null; // owner's own number, or null to use Zad's
  tempC: number | null;  // null = use settings.csv
  target: string | null; // day to plan (YYYY-MM-DD); null = tomorrow
}

export const NORMAL: Occasion = { id: 'none', guestMultiplier: 1, appetiteMultiplier: 1, usualOverprep: 1.28, dishAdjustments: {} };

export function computeVenue(data: ZadData, venueId: string, sc: Scenario) {
  const venue = data.venues.find((v) => v.id === venueId) ?? data.venues[0];
  if (!venue) return null;
  // days in Qatar's calendar count as occasions for the learned model too
  const history = data.history.filter((h) => h.venueId === venue.id)
    .map((h) => (h.occasion === 'none' ? { ...h, occasion: eventOn(data.calendar, h.date)?.occasion ?? 'none' } : h));
  const dishes = data.dishes.filter((d) => d.venueId === venue.id);
  if (history.length < 8 || !dishes.length) return null;

  const today = history[history.length - 1].date;
  const tomorrow = addDays(today, 1);
  const target = sc.target && sc.target > today ? sc.target : tomorrow;
  const none = data.occasions.find((o) => o.id === 'none') ?? NORMAL;
  const occById = (id: string | null | undefined) => (id ? data.occasions.find((o) => o.id === id) : undefined);
  const calEvent = eventOn(data.calendar, target);
  const occFromCalendar = sc.occasion === null;
  const occ = occById(sc.occasion ?? calEvent?.occasion) ?? none;
  const occFor = (d: string) => occById(eventOn(data.calendar, d)?.occasion) ?? none;
  const weekend = parseWeekend(setting(data, 'weekend_days', venue.id));
  const tempC = sc.tempC ?? numSetting(data, 'temp_tomorrow_c', venue.id, NaN);
  const temp = Number.isFinite(tempC) ? tempC : null;

  const steps = explainGuests(venue, history, today, target, occ, temp);
  const guests = sc.guests ?? steps.expected;
  const unc = uncertainty(null, occ) + (sc.guests !== null ? 0.01 : 0);
  const week = weekAhead(venue, history, today, target, steps, unc, occFor, weekend, occ.id);

  const plan = planDishes(venue, dishes, guests, occ, temp);
  const totalKg = sum(plan.map((p) => p.fcKg));
  const usualKg = sum(plan.map((p) => p.usualKg));
  const saveKg = sum(plan.map((p) => Math.max(0, p.usualKg - p.fcKg)));
  const saveQar = sum(plan.map((p) => Math.max(0, p.usualKg - p.fcKg) * p.dish.costPerKg));

  // learned model
  let model: ReturnType<typeof fitModel> | null = null;
  let test: ReturnType<typeof backtest> | null = null;
  let modelTomorrow: number | null = null;
  try {
    model = fitModel(history);
    test = history.length >= 22 ? backtest(venue, history) : null;
    modelTomorrow = predictModel(model, history, target, occ.id !== 'none', occ.guestMultiplier);
  } catch { /* too little or degenerate data: the panel says so */ }

  const last14 = history.slice(-14);
  const last28 = history.slice(-28);
  const sav = savings(history, dishes);
  const donatedShare = numSetting(data, 'donated_share', venue.id, 0) / 100;
  const sources = wasteSources(sum(last14.map((d) => d.wastedKg)), [
    { key: 'overproduction', pct: numSetting(data, 'waste_share_overproduction', venue.id, 0) },
    { key: 'plate', pct: numSetting(data, 'waste_share_plate', venue.id, 0) },
    { key: 'trimmings', pct: numSetting(data, 'waste_share_trimmings', venue.id, 0) },
  ]);

  return {
    venue, history, dishes, today, tomorrow, target, isTomorrow: target === tomorrow,
    occ, none, temp, calEvent, occFromCalendar, weekend,
    isWeekend: weekend.includes(steps.weekdayIndex),
    upcoming: upcoming(data.calendar, today),
    steps, guests, unc, week, plan, totalKg, usualKg, saveKg, saveQar,
    model, test, modelTomorrow,
    last14, last28,
    savings: sav,
    rate7: wasteRate(history.slice(-7)),
    accuracy: loggedAccuracy(history, 14),
    funnel: funnel(last14, donatedShare),
    donatedShare,
    sources,
  };
}
export type VenueView = NonNullable<ReturnType<typeof computeVenue>>;
