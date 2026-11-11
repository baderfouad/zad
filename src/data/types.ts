export type VenueKind = 'buffet' | 'alacarte';
export type Service = 'Breakfast' | 'Lunch' | 'Dinner' | 'All day';
export type Station = 'Hot line' | 'Grill' | 'Cold' | 'Bakery' | 'Pastry';
export type Period = 'Before Zad' | 'With Zad';

export interface Venue {
  id: string;
  nameEn: string;
  nameAr: string;
  type: string;
  kind: VenueKind;
  typicalGuests: number;
  trend: number;
}

export interface Dish {
  venueId: string;
  id: string;
  nameEn: string;
  nameAr: string;
  service: Service;
  station: Station;
  gramsPerGuest: number;
  costPerKg: number;
}

export interface DayRecord {
  date: string; // YYYY-MM-DD
  weekday: number; // 0 = Sunday … 6 = Saturday (derived from the date)
  venueId: string;
  period: Period;
  guestsActual: number;
  guestsForecast: number | null;
  preparedKg: number;
  wastedKg: number;
  wastePct: number; // recomputed: wasted ÷ prepared
  occasion: string; // optional column, "none" when blank
}

export interface WeekdayPrior {
  venueId: string;
  weekday: number;
  factor: number;
}

export interface Occasion {
  id: string;
  guestMultiplier: number;
  appetiteMultiplier: number;
  usualOverprep: number;
  /** keys are dish ids or service names in lower case ("breakfast") */
  dishAdjustments: Record<string, number>;
}

export interface Leftover {
  date: string;
  venueId: string;
  dishId: string;
  leftKg: number;
  heldSafely: boolean;
}

export interface Setting {
  key: string;
  venueId: string; // "all" or a venue id
  value: string;
}

export type FileName = 'venues' | 'dishes' | 'history' | 'weekday' | 'occasions' | 'leftovers' | 'settings';
export const FILES: FileName[] = ['venues', 'dishes', 'history', 'weekday', 'occasions', 'leftovers', 'settings'];

export interface DataWarning {
  file: FileName;
  row: number; // 1-based spreadsheet row (header is row 1)
  message: string;
}

export interface RawTable {
  headers: string[];
  rows: Record<string, unknown>[];
}

export interface ZadData {
  venues: Venue[];
  dishes: Dish[];
  history: DayRecord[];
  weekday: WeekdayPrior[];
  occasions: Occasion[];
  leftovers: Leftover[];
  settings: Setting[];
  warnings: DataWarning[];
  raw: Record<FileName, RawTable>;
  /** which files came from a session upload instead of public/data */
  overridden: FileName[];
}
