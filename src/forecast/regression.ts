import type { DayRecord, Venue } from '../data/types';
import { addDays, dayDiff, weekdayOfIso } from './dates';

/**
 * A real fitted model: multiple linear regression, solved in the browser with the normal equations.
 * Features: one-hot weekday (Mon…Sat, Sunday is the baseline), days since start, is_occasion, guests 7 days earlier.
 * A tiny ridge term keeps the maths stable when a feature never varies (e.g. no occasions in the history yet).
 */
export const FEATURES = ['intercept', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'days_since_start', 'is_occasion', 'lag_7_guests'] as const;
export type Feature = (typeof FEATURES)[number];

export interface Model {
  coef: number[];        // in original units, one per FEATURES entry
  start: string;         // first date in the history (day 0)
  trainRows: number;
  ridge: number;         // chosen by cross-validation
}

export interface Backtest {
  dates: string[];
  actual: number[];
  model: number[];
  baseline: number[];
  modelMape: number;
  baselineMape: number;
  trainRows: number;
  testRows: number;
  ridge: number;
}

const RIDGE = 1e-3;
/** Ridge strengths tried. The model picks one by leave-one-out cross-validation on its training days only. */
export const RIDGE_GRID = [0.001, 0.01, 0.1, 1, 10];

function featureRow(date: string, start: string, isOcc: boolean, lag7: number): number[] {
  const wd = weekdayOfIso(date);
  const oneHot = [1, 2, 3, 4, 5, 6].map((d) => (wd === d ? 1 : 0));
  return [1, ...oneHot, dayDiff(start, date), isOcc ? 1 : 0, lag7];
}

/** Solve A x = b with Gaussian elimination and partial pivoting. */
export function solve(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    const piv = M[c][c];
    if (Math.abs(piv) < 1e-12) throw new Error('singular matrix');
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c] / piv;
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((row, i) => row[n] / row[i]);
}

/** Ordinary least squares with a small ridge term on standardised features (not on the intercept). */
export function fitLinear(X: number[][], y: number[], ridge = RIDGE): number[] {
  const p = X[0].length;
  const mu = Array(p).fill(0), sd = Array(p).fill(1);
  for (let j = 1; j < p; j++) {
    mu[j] = X.reduce((a, r) => a + r[j], 0) / X.length;
    const v = X.reduce((a, r) => a + (r[j] - mu[j]) ** 2, 0) / X.length;
    sd[j] = v > 1e-12 ? Math.sqrt(v) : 1;
  }
  const Z = X.map((r) => r.map((x, j) => (j === 0 ? 1 : (x - mu[j]) / sd[j])));
  const XtX = Array.from({ length: p }, (_, i) => Array.from({ length: p }, (_, j) => Z.reduce((a, r) => a + r[i] * r[j], 0)));
  for (let j = 1; j < p; j++) XtX[j][j] += ridge * Z.length;
  const Xty = Array.from({ length: p }, (_, i) => Z.reduce((a, r, k) => a + r[i] * y[k], 0));
  const w = solve(XtX, Xty);
  // back to original units
  const coef = w.map((wj, j) => (j === 0 ? wj : wj / sd[j]));
  coef[0] = w[0] - w.slice(1).reduce((a, wj, k) => a + (wj * mu[k + 1]) / sd[k + 1], 0);
  return coef;
}

const predictRow = (coef: number[], x: number[]) => x.reduce((a, xi, i) => a + xi * coef[i], 0);

function rowsFor(history: DayRecord[]) {
  const byDate = new Map(history.map((h) => [h.date, h]));
  const start = history[0]?.date ?? '';
  return history
    .map((h) => {
      const lag = byDate.get(addDays(h.date, -7));
      return lag ? { h, x: featureRow(h.date, start, h.occasion !== 'none', lag.guestsActual) } : null;
    })
    .filter((r): r is { h: DayRecord; x: number[] } => r !== null);
}

/** Leave-one-out: fit on every training day but one, predict that day, repeat; keep the ridge with the lowest error. */
export function chooseRidge(X: number[][], y: number[], grid = RIDGE_GRID): number {
  let best = grid[0], bestErr = Infinity;
  for (const lam of grid) {
    let err = 0;
    for (let i = 0; i < X.length; i++) {
      const c = fitLinear(X.filter((_, j) => j !== i), y.filter((_, j) => j !== i), lam);
      err += Math.abs(predictRow(c, X[i]) - y[i]) / y[i];
    }
    if (err < bestErr - 1e-12) { bestErr = err; best = lam; }
  }
  return best;
}

export function fitModel(history: DayRecord[]): Model {
  const rows = rowsFor(history);
  const X = rows.map((r) => r.x), y = rows.map((r) => r.h.guestsActual);
  const ridge = chooseRidge(X, y);
  return { coef: fitLinear(X, y, ridge), start: history[0].date, trainRows: rows.length, ridge };
}

export function predictModel(model: Model, history: DayRecord[], date: string, isOccasion: boolean, occMultiplier = 1): number {
  const lag = history.find((h) => h.date === addDays(date, -7));
  const lagGuests = lag ? lag.guestsActual : history[history.length - 1].guestsActual;
  let g = predictRow(model.coef, featureRow(date, model.start, isOccasion, lagGuests));
  // When the history has no occasions yet, the model cannot learn their size, so fall back to the occasion multiplier.
  if (isOccasion && Math.abs(model.coef[8]) < 1e-9) g *= occMultiplier;
  return Math.round(g);
}

export const mape = (actual: number[], pred: number[]) =>
  actual.reduce((a, y, i) => a + Math.abs(pred[i] - y) / y, 0) / actual.length;

/**
 * Train on all but the last `testDays` days, test on the last `testDays`.
 * The simple-average baseline is scored on the same days, using only training data.
 */
export function backtest(venue: Venue, history: DayRecord[], testDays = 7): Backtest {
  const rows = rowsFor(history);
  const train = rows.slice(0, -testDays), test = rows.slice(-testDays);
  const X = train.map((r) => r.x), y = train.map((r) => r.h.guestsActual);
  const ridge = chooseRidge(X, y);
  const coef = fitLinear(X, y, ridge);
  const cutoff = test[0].h.date;
  const trainHist = history.filter((h) => h.date < cutoff).slice(-28);
  const typical = trainHist.reduce((a, h) => a + h.guestsActual, 0) / trainHist.length;
  const baseFor = (wd: number) => {
    const same = trainHist.filter((h) => h.weekday === wd);
    return same.length ? same.reduce((a, h) => a + h.guestsActual, 0) / same.length : typical;
  };
  const actual = test.map((r) => r.h.guestsActual);
  const model = test.map((r) => Math.round(predictRow(coef, r.x)));
  const baseline = test.map((r) => Math.round(baseFor(r.h.weekday) * venue.trend));
  return {
    dates: test.map((r) => r.h.date), actual, model, baseline,
    modelMape: mape(actual, model), baselineMape: mape(actual, baseline),
    trainRows: train.length, testRows: test.length, ridge,
  };
}
