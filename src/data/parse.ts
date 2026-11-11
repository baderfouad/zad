import Papa from 'papaparse';
import type {
  DataWarning, DayRecord, Dish, FileName, Leftover, Occasion, RawTable, Service, Setting, Station, Venue,
  WeekdayPrior, ZadData,
} from './types';

export const REQUIRED_COLUMNS: Record<FileName, string[]> = {
  venues: ['venue_id', 'name_en', 'name_ar', 'type', 'typical_guests', 'trend'],
  dishes: ['venue_id', 'dish_id', 'name_en', 'name_ar', 'service', 'station', 'grams_per_guest', 'cost_qar_per_kg'],
  history: ['date', 'venue_id', 'period', 'guests_actual', 'guests_forecast', 'food_prepared_kg', 'food_wasted_kg'],
  weekday: ['venue_id', 'weekday', 'factor'],
  occasions: ['occasion', 'guest_multiplier', 'appetite_multiplier', 'usual_overprep', 'dish_adjustments'],
  leftovers: ['date', 'venue_id', 'dish_id', 'left_kg', 'held_safely'],
  settings: ['setting', 'venue_id', 'value'],
};

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const SERVICES: Service[] = ['Breakfast', 'Lunch', 'Dinner', 'All day'];
const STATIONS: Station[] = ['Hot line', 'Grill', 'Cold', 'Bakery', 'Pastry'];

export function parseCsv(text: string): RawTable {
  const res = Papa.parse<Record<string, unknown>>(text.replace(/^﻿/, ''), {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim(),
  });
  return { headers: res.meta.fields ?? [], rows: res.data };
}

/** Which file a CSV is, judged by its headers. Used for uploads. */
export function detectFile(headers: string[]): FileName | null {
  const set = new Set(headers);
  const order: FileName[] = ['history', 'dishes', 'leftovers', 'occasions', 'venues', 'settings', 'weekday'];
  return order.find((f) => REQUIRED_COLUMNS[f].every((c) => set.has(c))) ?? null;
}

class RowError extends Error {}

const str = (v: unknown, col: string): string => {
  if (v === null || v === undefined || String(v).trim() === '') throw new RowError(`"${col}" is empty`);
  return String(v).trim();
};
const optStr = (v: unknown): string => (v === null || v === undefined ? '' : String(v).trim());
const num = (v: unknown, col: string, opts: { min?: number; max?: number } = {}): number => {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').trim().replace(',', '.'));
  if (v === null || v === undefined || String(v).trim() === '' || !Number.isFinite(n)) {
    throw new RowError(`"${col}" should be a number but is "${optStr(v)}"`);
  }
  if (opts.min !== undefined && n < opts.min) throw new RowError(`"${col}" is ${n}, below ${opts.min}`);
  if (opts.max !== undefined && n > opts.max) throw new RowError(`"${col}" is ${n}, above ${opts.max}`);
  return n;
};
const optNum = (v: unknown, col: string): number | null =>
  v === null || v === undefined || String(v).trim() === '' ? null : num(v, col, { min: 0 });
const bool = (v: unknown, col: string): boolean => {
  const s = optStr(v).toLowerCase();
  if (['yes', 'true', 'y', '1', 'نعم'].includes(s)) return true;
  if (['no', 'false', 'n', '0', 'لا', ''].includes(s)) return false;
  throw new RowError(`"${col}" should be yes or no but is "${optStr(v)}"`);
};

/** Accepts 2026-11-11, 11/11/2026 is NOT accepted (ambiguous); spreadsheets export ISO when the cell is a date. */
const isoDate = (v: unknown, col: string): string => {
  const s = str(v, col).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(Date.parse(s + 'T00:00:00Z'))) {
    throw new RowError(`"${col}" should be a date like 2026-11-11 but is "${optStr(v)}"`);
  }
  return s;
};
export const weekdayOf = (iso: string): number => new Date(iso + 'T00:00:00Z').getUTCDay();

/** "umm×1.3; luq ×1.5; breakfast x0.45" → { umm: 1.3, luq: 1.5, breakfast: 0.45 } */
export function parseAdjustments(s: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const part of s.split(/[;,]/)) {
    const p = part.trim();
    if (!p) continue;
    const m = p.match(/^([\p{L}\w-]+)\s*[×xX*]\s*([\d.]+)$/u);
    if (!m) throw new RowError(`can't read the dish adjustment "${p}" (expected like umm×1.3)`);
    out[m[1].toLowerCase()] = Number(m[2]);
  }
  return out;
}

function eachRow<T>(file: FileName, table: RawTable, warnings: DataWarning[], fn: (r: Record<string, unknown>) => T): T[] {
  const missing = REQUIRED_COLUMNS[file].filter((c) => !table.headers.includes(c));
  if (missing.length) {
    warnings.push({ file, row: 1, message: `missing column${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}` });
    return [];
  }
  const out: T[] = [];
  table.rows.forEach((r, i) => {
    try {
      out.push(fn(r));
    } catch (e) {
      if (e instanceof RowError) warnings.push({ file, row: i + 2, message: e.message + '. Row skipped.' });
      else throw e;
    }
  });
  return out;
}

export function buildData(raw: Record<FileName, RawTable>, overridden: FileName[] = []): ZadData {
  const warnings: DataWarning[] = [];

  const venues: Venue[] = eachRow('venues', raw.venues, warnings, (r) => {
    const type = str(r.type, 'type');
    return {
      id: str(r.venue_id, 'venue_id'),
      nameEn: str(r.name_en, 'name_en'),
      nameAr: str(r.name_ar, 'name_ar'),
      type,
      kind: /hotel|buffet/i.test(type) ? 'buffet' : 'alacarte',
      typicalGuests: num(r.typical_guests, 'typical_guests', { min: 1 }),
      trend: num(r.trend, 'trend', { min: 0.5, max: 1.5 }),
    };
  });
  const venueIds = new Set(venues.map((v) => v.id));
  const knownVenue = (v: unknown) => {
    const id = str(v, 'venue_id');
    if (!venueIds.has(id)) throw new RowError(`venue "${id}" is not in venues.csv`);
    return id;
  };

  const dishes: Dish[] = eachRow('dishes', raw.dishes, warnings, (r) => {
    const service = str(r.service, 'service');
    const station = str(r.station, 'station');
    const svc = SERVICES.find((s) => s.toLowerCase() === service.toLowerCase());
    const stn = STATIONS.find((s) => s.toLowerCase() === station.toLowerCase());
    if (!svc) throw new RowError(`service "${service}" should be one of ${SERVICES.join(', ')}`);
    if (!stn) throw new RowError(`station "${station}" should be one of ${STATIONS.join(', ')}`);
    return {
      venueId: knownVenue(r.venue_id),
      id: str(r.dish_id, 'dish_id'),
      nameEn: str(r.name_en, 'name_en'),
      nameAr: str(r.name_ar, 'name_ar'),
      service: svc,
      station: stn,
      gramsPerGuest: num(r.grams_per_guest, 'grams_per_guest', { min: 0, max: 2000 }),
      costPerKg: num(r.cost_qar_per_kg, 'cost_qar_per_kg', { min: 0 }),
    };
  });

  const seenDays = new Set<string>();
  const history: DayRecord[] = eachRow('history', raw.history, warnings, (r) => {
    const date = isoDate(r.date, 'date');
    const venueId = knownVenue(r.venue_id);
    const key = venueId + date;
    if (seenDays.has(key)) throw new RowError(`${venueId} already has a row for ${date}`);
    const p = str(r.period, 'period').toLowerCase();
    const period = p.startsWith('before') ? 'Before Zad' : p.startsWith('with') ? 'With Zad' : null;
    if (!period) throw new RowError(`period should be "Before Zad" or "With Zad"`);
    const preparedKg = num(r.food_prepared_kg, 'food_prepared_kg', { min: 0.1 });
    const wastedKg = num(r.food_wasted_kg, 'food_wasted_kg', { min: 0 });
    if (wastedKg > preparedKg) throw new RowError(`food_wasted_kg (${wastedKg}) is more than food_prepared_kg (${preparedKg})`);
    seenDays.add(key);
    return {
      date, venueId, period,
      weekday: weekdayOf(date),
      guestsActual: num(r.guests_actual, 'guests_actual', { min: 0 }),
      guestsForecast: optNum(r.guests_forecast, 'guests_forecast'),
      preparedKg, wastedKg,
      wastePct: wastedKg / preparedKg,
      occasion: optStr(r.occasion).toLowerCase() || 'none',
    } satisfies DayRecord;
  }).sort((a, b) => (a.venueId === b.venueId ? a.date.localeCompare(b.date) : a.venueId.localeCompare(b.venueId)));

  const weekday: WeekdayPrior[] = eachRow('weekday', raw.weekday, warnings, (r) => {
    const w = WEEKDAYS.indexOf(str(r.weekday, 'weekday').toLowerCase());
    if (w < 0) throw new RowError(`weekday "${optStr(r.weekday)}" is not a day name`);
    return { venueId: knownVenue(r.venue_id), weekday: w, factor: num(r.factor, 'factor', { min: 0.1, max: 3 }) };
  });

  const occasions: Occasion[] = eachRow('occasions', raw.occasions, warnings, (r) => ({
    id: str(r.occasion, 'occasion').toLowerCase(),
    guestMultiplier: num(r.guest_multiplier, 'guest_multiplier', { min: 0.1, max: 5 }),
    appetiteMultiplier: num(r.appetite_multiplier, 'appetite_multiplier', { min: 0.1, max: 5 }),
    usualOverprep: num(r.usual_overprep, 'usual_overprep', { min: 0.5, max: 5 }),
    dishAdjustments: parseAdjustments(optStr(r.dish_adjustments)),
  }));
  if (!occasions.some((o) => o.id === 'none')) {
    warnings.push({ file: 'occasions', row: 1, message: 'there is no "none" row for a normal day. Using 1 for every multiplier and 1.28 over-prep.' });
    occasions.unshift({ id: 'none', guestMultiplier: 1, appetiteMultiplier: 1, usualOverprep: 1.28, dishAdjustments: {} });
  }

  const leftovers: Leftover[] = eachRow('leftovers', raw.leftovers, warnings, (r) => ({
    date: isoDate(r.date, 'date'),
    venueId: knownVenue(r.venue_id),
    dishId: str(r.dish_id, 'dish_id'),
    leftKg: num(r.left_kg, 'left_kg', { min: 0 }),
    heldSafely: bool(r.held_safely, 'held_safely'),
  }));

  const settings: Setting[] = eachRow('settings', raw.settings, warnings, (r) => ({
    key: str(r.setting, 'setting'),
    venueId: str(r.venue_id, 'venue_id'),
    value: optStr(r.value),
  }));

  for (const v of venues) {
    const n = history.filter((h) => h.venueId === v.id).length;
    if (n < 14) warnings.push({ file: 'history', row: 1, message: `${v.id} has only ${n} days of history. Zad needs at least 14 to learn from.` });
    if (!dishes.some((d) => d.venueId === v.id)) warnings.push({ file: 'dishes', row: 1, message: `${v.id} has no dishes.` });
  }

  return { venues, dishes, history, weekday, occasions, leftovers, settings, warnings, raw, overridden };
}

/** A setting for a venue, falling back to the "all" row. */
export function setting(data: Pick<ZadData, 'settings'>, key: string, venueId: string): string | undefined {
  return (
    data.settings.find((s) => s.key === key && s.venueId === venueId)?.value ??
    data.settings.find((s) => s.key === key && s.venueId === 'all')?.value
  );
}
export function numSetting(data: Pick<ZadData, 'settings'>, key: string, venueId: string, fallback: number): number {
  const v = setting(data, key, venueId);
  const n = v === undefined || v === '' ? NaN : Number(v);
  return Number.isFinite(n) ? n : fallback;
}
