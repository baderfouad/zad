import type { Dish, Occasion, Venue } from '../data/types';

const HEAVY = ['ouzi', 'lamb', 'harees'];
const LIGHT = ['salad', 'fruit'];
export const HOT_DAY_C = 38;

export interface DishPlan {
  dish: Dish;
  fcKg: number;
  usualKg: number;
  lo: number;
  hi: number;
  adjustment: number;
  heat: number;
  /** cooking plan: share of the dish and when to cook it */
  batches: { share: number; kg: number; when: 'open' | 'plus60' | 'plus105' | 'lunch' | 'dinner' }[];
}

export function dishAdjustment(dish: Dish, occ: Occasion): number {
  return (occ.dishAdjustments[dish.id.toLowerCase()] ?? 1) * (occ.dishAdjustments[dish.service.toLowerCase()] ?? 1);
}

export function heatAdjustment(dish: Dish, tempC: number | null): number {
  if (tempC === null || tempC < HOT_DAY_C) return 1;
  if (HEAVY.includes(dish.id)) return 0.85;
  if (LIGHT.includes(dish.id)) return 1.2;
  return 1;
}

export function uncertainty(dish: Dish | null, occ: Occasion): number {
  return 0.07 + (occ.id !== 'none' ? 0.05 : 0) + (dish?.station === 'Grill' ? 0.02 : 0);
}

export function planDishes(venue: Venue, dishes: Dish[], guests: number, occ: Occasion, tempC: number | null): DishPlan[] {
  return dishes.map((dish) => {
    const adj = dishAdjustment(dish, occ);
    const heat = heatAdjustment(dish, tempC);
    const perGuest = dish.gramsPerGuest / 1000;
    const fcKg = guests * perGuest * occ.appetiteMultiplier * adj * heat;
    const usualKg = venue.typicalGuests * occ.guestMultiplier * perGuest * occ.usualOverprep * adj;
    const u = uncertainty(dish, occ);
    const batches: DishPlan['batches'] =
      venue.kind === 'buffet'
        ? [{ share: 0.6, when: 'open' as const }, { share: 0.2, when: 'plus60' as const }, { share: 0.2, when: 'plus105' as const }].map((b) => ({ ...b, kg: fcKg * b.share }))
        : [{ share: 0.45, when: 'lunch' as const }, { share: 0.55, when: 'dinner' as const }].map((b) => ({ ...b, kg: fcKg * b.share }));
    return { dish, fcKg, usualKg, lo: fcKg * (1 - u), hi: fcKg * (1 + u), adjustment: adj, heat, batches };
  });
}

export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
