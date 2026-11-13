import { describe, expect, it } from 'vitest';
import { csv, loadFixture } from '../../test-utils';
import { addDays, briefGroups, computeVenue, explainGuests, fitLinear, planDishes, solve, weatherFactor } from '..';

describe('linear algebra', () => {
  it('solves a small system', () => {
    expect(solve([[2, 1], [1, 3]], [3, 5]).map((x) => +x.toFixed(6))).toEqual([0.8, 1.4]);
  });
  it('recovers known coefficients', () => {
    const X = Array.from({ length: 30 }, (_, i) => [1, i, (i * 7) % 5]);
    const y = X.map((r) => 4 + 2 * r[1] - 3 * r[2]);
    const c = fitLinear(X, y, 1e-9);
    expect(c[0]).toBeCloseTo(4, 3); expect(c[1]).toBeCloseTo(2, 3); expect(c[2]).toBeCloseTo(-3, 3);
  });
});

describe('baseline guests', () => {
  const d = loadFixture();
  const hotel = d.venues[0], rest = d.venues[1];
  const hist = d.history.filter((h) => h.venueId === 'hotel');
  const none = d.occasions.find((o) => o.id === 'none')!;
  const national = d.occasions.find((o) => o.id === 'national')!;

  it('steps add up to the expected number', () => {
    const s = explainGuests(hotel, hist, '2026-11-11', '2026-11-12', national, 29);
    expect(s.typical + s.weekday + s.occasion + s.weather + s.trend).toBeCloseTo(s.expected, 6);
  });

  it('follows the formula in the skill', () => {
    const win = hist.slice(-28);
    const typical = win.reduce((a, h) => a + h.guestsActual, 0) / 28;
    const thu = win.filter((h) => h.weekday === 4);
    const thuMean = thu.reduce((a, h) => a + h.guestsActual, 0) / thu.length;
    const s = explainGuests(hotel, hist, '2026-11-11', '2026-11-12', none, 29);
    expect(s.typical).toBeCloseTo(typical);
    expect(s.weekday).toBeCloseTo(thuMean - typical);
    expect(s.expected).toBe(Math.round(thuMean * 1.03)); // hotels ignore weather
  });

  it('weather affects restaurants only', () => {
    expect(weatherFactor(hotel, 25)).toBe(1);
    expect(weatherFactor(rest, 25)).toBeCloseTo(1.03);
    expect(weatherFactor(rest, 40)).toBeCloseTo(1 - 3 * 0.012);
    expect(weatherFactor(rest, 33)).toBe(1);
  });
});

describe('kg per dish', () => {
  const d = loadFixture();
  const hotel = d.venues[0];
  const dishes = d.dishes.filter((x) => x.venueId === 'hotel');
  const ramadan = d.occasions.find((o) => o.id === 'ramadan')!;
  it('applies grams, appetite, dish and service adjustments', () => {
    const p = planDishes(hotel, dishes, 400, ramadan, 29);
    const umm = p.find((x) => x.dish.id === 'umm')!;
    expect(umm.fcKg).toBeCloseTo(400 * 0.06 * 1.1 * 1.3);
    const shak = p.find((x) => x.dish.id === 'shak')!; // breakfast ×0.45 in Ramadan
    expect(shak.fcKg).toBeCloseTo(400 * 0.07 * 1.1 * 0.45);
    expect(shak.usualKg).toBeCloseTo(380 * 1.15 * 0.07 * 1.5 * 0.45);
    expect(umm.batches.map((b) => b.share)).toEqual([0.6, 0.2, 0.2]);
  });
  it('lightens heavy dishes on very hot days', () => {
    const none = d.occasions[0];
    const p = planDishes(hotel, dishes, 100, none, 40);
    expect(p.find((x) => x.dish.id === 'ouzi')!.heat).toBe(0.85);
    expect(p.find((x) => x.dish.id === 'salad')!.heat).toBe(1.2);
  });
});

describe('whole venue', () => {
  it('uses the day after the last history date as tomorrow', () => {
    const v = computeVenue(loadFixture(), 'hotel', { occasion: 'none', guests: null, tempC: null })!;
    expect(v.today).toBe('2026-11-11');
    expect(v.tomorrow).toBe(addDays('2026-11-11', 1));
    expect(v.week).toHaveLength(7);
    expect(v.test!.testRows).toBe(7);
    expect(v.test!.modelMape).toBeGreaterThan(0);
  });

  it('changes when history.csv changes', () => {
    const a = computeVenue(loadFixture(), 'hotel', { occasion: 'none', guests: null, tempC: null })!;
    const text = csv('history').replace('2026-11-05,Thursday,hotel,With Zad,404', '2026-11-05,Thursday,hotel,With Zad,804');
    const b = computeVenue(loadFixture({ history: text }), 'hotel', { occasion: 'none', guests: null, tempC: null })!;
    expect(b.steps.expected).toBeGreaterThan(a.steps.expected);
    expect(b.totalKg).toBeGreaterThan(a.totalKg);
  });

  it("uses the owner's own number when given", () => {
    const v = computeVenue(loadFixture(), 'restaurant', { occasion: 'none', guests: 300, tempC: null })!;
    expect(v.guests).toBe(300);
  });
});

describe('kitchen brief', () => {
  it('groups a buffet by meal and keeps the total', () => {
    const v = computeVenue(loadFixture(), 'hotel', { occasion: 'none', guests: null, tempC: null })!;
    const g = briefGroups(v.plan, 'buffet');
    expect(g.map((x) => x.key)).toEqual(['Breakfast', 'Lunch', 'Dinner']);
    expect(g.reduce((a, x) => a + x.kg, 0)).toBeCloseTo(v.totalKg);
    expect(g[0].dishes[0].kg).toBeGreaterThanOrEqual(g[0].dishes[1].kg);
  });
  it('splits a restaurant 45% lunch / 55% dinner', () => {
    const v = computeVenue(loadFixture(), 'restaurant', { occasion: 'none', guests: null, tempC: null })!;
    const g = briefGroups(v.plan, 'alacarte');
    expect(g.map((x) => x.key)).toEqual(['Lunch', 'Dinner']);
    expect(g[0].kg).toBeCloseTo(v.totalKg * 0.45);
    expect(g[1].kg).toBeCloseTo(v.totalKg * 0.55);
  });
});
