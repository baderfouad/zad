import type { DayRecord, Dish, Leftover } from './types';

/** One meal is 0.45 kg. Use only for "≈ meals" labels. */
export const MEAL_KG = 0.45;

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const mean = (xs: number[]) => (xs.length ? sum(xs) / xs.length : 0);

/** Cost per kg weighted by how much of each dish a guest eats. */
export function weightedCostPerKg(dishes: Dish[]): number {
  const g = sum(dishes.map((d) => d.gramsPerGuest));
  return g ? sum(dishes.map((d) => d.gramsPerGuest * d.costPerKg)) / g : 0;
}

/** Waste share for a set of days: total wasted ÷ total prepared. */
export const wasteRate = (days: DayRecord[]) => {
  const p = sum(days.map((d) => d.preparedKg));
  return p ? sum(days.map((d) => d.wastedKg)) / p : 0;
};

export interface Savings {
  daysWithZad: number;
  daysBefore: number;
  avgWasteBeforeKg: number;
  avgWasteWithKg: number;
  savedKg: number;      // waste avoided since Zad started
  savedQar: number;
  savedMeals: number;
  rateBefore: number;
  rateWith: number;
  avgPreparedBeforeKg: number;
  avgPreparedWithKg: number;
  zadStart: string | null;
}

/** Waste avoided since Zad started = Σ over Zad days of (average daily waste before Zad − that day's waste). */
export function savings(history: DayRecord[], dishes: Dish[]): Savings {
  const before = history.filter((h) => h.period === 'Before Zad');
  const withZ = history.filter((h) => h.period === 'With Zad');
  const avgB = mean(before.map((h) => h.wastedKg));
  const savedKg = before.length ? sum(withZ.map((h) => avgB - h.wastedKg)) : 0;
  return {
    daysWithZad: withZ.length,
    daysBefore: before.length,
    avgWasteBeforeKg: avgB,
    avgWasteWithKg: mean(withZ.map((h) => h.wastedKg)),
    savedKg,
    savedQar: savedKg * weightedCostPerKg(dishes),
    savedMeals: savedKg / MEAL_KG,
    rateBefore: wasteRate(before),
    rateWith: wasteRate(withZ),
    avgPreparedBeforeKg: mean(before.map((h) => h.preparedKg)),
    avgPreparedWithKg: mean(withZ.map((h) => h.preparedKg)),
    zadStart: withZ[0]?.date ?? null,
  };
}

/** Accuracy of the forecasts Zad logged in history.csv (guests_forecast vs guests_actual). */
export function loggedAccuracy(history: DayRecord[], lastN = 14) {
  const days = history.filter((h) => h.guestsForecast !== null && h.guestsActual > 0).slice(-lastN);
  const mape = mean(days.map((h) => Math.abs(h.guestsForecast! - h.guestsActual) / h.guestsActual));
  return { days, mape, accuracy: days.length ? 1 - mape : 0 };
}

export interface Funnel { cooked: number; eaten: number; leftover: number; donated: number; thrown: number }

/** Where the food went over a set of days. `donatedShare` is 0–1 (from settings.csv). */
export function funnel(days: DayRecord[], donatedShare: number): Funnel {
  const cooked = sum(days.map((d) => d.preparedKg));
  const leftover = sum(days.map((d) => d.wastedKg));
  const donated = leftover * donatedShare;
  return { cooked, eaten: cooked - leftover, leftover, donated, thrown: leftover - donated };
}

/** Split total waste by source, normalising the shares from settings.csv so they always add to 100%. */
export function wasteSources(totalKg: number, shares: { key: string; pct: number }[]) {
  const t = sum(shares.map((s) => Math.max(0, s.pct)));
  return shares.map((s) => ({ key: s.key, share: t ? Math.max(0, s.pct) / t : 0, kg: t ? (totalKg * Math.max(0, s.pct)) / t : 0 }));
}

export interface LeftoverEntry { dishId: string; leftKg: number; heldSafely: boolean }

/** Today's leftovers for a venue: the rows on the latest date in leftovers.csv. */
export function latestLeftovers(rows: Leftover[], venueId: string, dishes: Dish[]): { date: string | null; entries: LeftoverEntry[] } {
  const mine = rows.filter((r) => r.venueId === venueId);
  const date = mine.reduce<string | null>((a, r) => (a === null || r.date > a ? r.date : a), null);
  const entries = dishes.map((d) => {
    const r = mine.find((x) => x.date === date && x.dishId === d.id);
    return { dishId: d.id, leftKg: r?.leftKg ?? 0, heldSafely: r?.heldSafely ?? false };
  });
  return { date, entries };
}

export function leftoverTotals(entries: LeftoverEntry[]) {
  const total = sum(entries.map((e) => e.leftKg));
  const safe = sum(entries.filter((e) => e.heldSafely).map((e) => e.leftKg));
  return { total, safe, meals: safe / MEAL_KG };
}
