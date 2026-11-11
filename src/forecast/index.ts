import { numSetting } from '../data/parse';
import { funnel, loggedAccuracy, savings, wasteRate, wasteSources } from '../data/derive';
import type { Occasion, ZadData } from '../data/types';
import { explainGuests, weekAhead } from './baseline';
import { addDays } from './dates';
import { planDishes, sum, uncertainty } from './dishes';
import { backtest, fitModel, predictModel } from './regression';

export * from './baseline';
export * from './dates';
export * from './dishes';
export * from './regression';

export interface Scenario {
  occasion: string;
  guests: number | null; // owner's own number, or null to use Zad's
  tempC: number | null;  // null = use settings.csv
}

export const NORMAL: Occasion = { id: 'none', guestMultiplier: 1, appetiteMultiplier: 1, usualOverprep: 1.28, dishAdjustments: {} };

export function computeVenue(data: ZadData, venueId: string, sc: Scenario) {
  const venue = data.venues.find((v) => v.id === venueId) ?? data.venues[0];
  if (!venue) return null;
  const history = data.history.filter((h) => h.venueId === venue.id);
  const dishes = data.dishes.filter((d) => d.venueId === venue.id);
  if (history.length < 8 || !dishes.length) return null;

  const today = history[history.length - 1].date;
  const tomorrow = addDays(today, 1);
  const occ = data.occasions.find((o) => o.id === sc.occasion) ?? data.occasions.find((o) => o.id === 'none') ?? NORMAL;
  const none = data.occasions.find((o) => o.id === 'none') ?? NORMAL;
  const tempC = sc.tempC ?? numSetting(data, 'temp_tomorrow_c', venue.id, NaN);
  const temp = Number.isFinite(tempC) ? tempC : null;

  const steps = explainGuests(venue, history, today, tomorrow, occ, temp);
  const guests = sc.guests ?? steps.expected;
  const unc = uncertainty(null, occ) + (sc.guests !== null ? 0.01 : 0);
  const week = weekAhead(venue, history, today, steps, unc);

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
    modelTomorrow = predictModel(model, history, tomorrow, occ.id !== 'none', occ.guestMultiplier);
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
    venue, history, dishes, today, tomorrow, occ, none, temp,
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
