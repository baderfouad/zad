import { describe, expect, it } from 'vitest';
import { csv, loadFixture } from '../../test-utils';
import { detectFile, parseAdjustments, parseCsv } from '../parse';
import { funnel, latestLeftovers, leftoverTotals, savings, wasteRate, wasteSources, weightedCostPerKg } from '../derive';

describe('parsing', () => {
  it('loads the sample data without warnings', () => {
    const d = loadFixture();
    expect(d.warnings).toEqual([]);
    expect(d.venues.map((v) => v.id)).toEqual(['hotel', 'restaurant']);
    expect(d.history).toHaveLength(56);
    expect(d.dishes).toHaveLength(19);
  });

  it('recomputes waste % instead of trusting the column', () => {
    const d = loadFixture();
    const row = d.history.find((h) => h.venueId === 'hotel' && h.date === '2026-10-15')!;
    expect(row.wastePct).toBeCloseTo(81.3 / 419.4);
  });

  it('reads dish adjustments with or without spaces', () => {
    expect(parseAdjustments('umm×1.3; luq ×1.5; breakfast x0.45')).toEqual({ umm: 1.3, luq: 1.5, breakfast: 0.45 });
  });

  it('accepts TRUE/FALSE as well as yes/no', () => {
    const d = loadFixture({ leftovers: 'date,venue_id,dish_id,left_kg,held_safely\n2026-11-11,hotel,shak,1,TRUE\n2026-11-11,hotel,foul,1,FALSE\n' });
    expect(d.leftovers.map((l) => l.heldSafely)).toEqual([true, false]);
  });

  it('skips broken rows with a plain warning instead of crashing', () => {
    const text = csv('history').replace('2026-10-16,Friday,hotel,Before Zad,433', '2026-10-16,Friday,hotel,Before Zad,lots');
    const d = loadFixture({ history: text });
    expect(d.history).toHaveLength(55);
    expect(d.warnings).toEqual([{ file: 'history', row: 3, message: expect.stringContaining('guests_actual') }]);
  });

  it('flags a missing column', () => {
    const d = loadFixture({ venues: 'venue_id,name_en\nhotel,x\n' });
    expect(d.warnings[0]).toMatchObject({ file: 'venues', row: 1 });
  });

  it('detects which file an upload is from its headers', () => {
    expect(detectFile(parseCsv(csv('history')).headers)).toBe('history');
    expect(detectFile(parseCsv(csv('weekday')).headers)).toBe('weekday');
    expect(detectFile(['a', 'b'])).toBeNull();
  });
});

describe('derived numbers', () => {
  const d = loadFixture();
  const hist = d.history.filter((h) => h.venueId === 'hotel');
  const dishes = d.dishes.filter((x) => x.venueId === 'hotel');

  it('weights cost per kg by grams per guest', () => {
    expect(weightedCostPerKg([
      { gramsPerGuest: 100, costPerKg: 10 }, { gramsPerGuest: 300, costPerKg: 20 },
    ] as never)).toBeCloseTo(17.5);
  });

  it('computes savings since Zad started from the history', () => {
    const s = savings(hist, dishes);
    expect(s.daysWithZad).toBe(14);
    expect(s.daysBefore).toBe(14);
    const before = hist.filter((h) => h.period === 'Before Zad');
    const avgB = before.reduce((a, h) => a + h.wastedKg, 0) / 14;
    const withZ = hist.filter((h) => h.period === 'With Zad');
    expect(s.savedKg).toBeCloseTo(withZ.reduce((a, h) => a + avgB - h.wastedKg, 0));
    expect(s.savedQar).toBeCloseTo(s.savedKg * weightedCostPerKg(dishes));
    expect(s.rateWith).toBeLessThan(s.rateBefore);
  });

  it('waste rate is total wasted over total prepared', () => {
    expect(wasteRate([{ preparedKg: 100, wastedKg: 10 }, { preparedKg: 300, wastedKg: 10 }] as never)).toBeCloseTo(0.05);
  });

  it('funnel adds up', () => {
    const f = funnel(hist.slice(-14), 0.38);
    expect(f.eaten + f.leftover).toBeCloseTo(f.cooked);
    expect(f.donated + f.thrown).toBeCloseTo(f.leftover);
  });

  it('waste sources are normalised to 100%', () => {
    const s = wasteSources(200, [{ key: 'a', pct: 60 }, { key: 'b', pct: 30 }, { key: 'c', pct: 30 }]);
    expect(s.map((x) => x.kg)).toEqual([100, 50, 50]);
  });

  it('only food held safely counts as donatable', () => {
    const { entries } = latestLeftovers(d.leftovers, 'hotel', dishes);
    const t = leftoverTotals(entries);
    expect(t.total).toBeCloseTo(19.8);
    expect(t.safe).toBeCloseTo(19.8 - 1.6);
  });
});
