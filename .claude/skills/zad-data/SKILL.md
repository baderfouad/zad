---
name: zad-data
description: The shape and meaning of Zad's CSV data files and how the app loads them. Use whenever reading, validating, adding or changing data, or when a number on screen looks wrong.
---

# Zad data

The data lives in `public/data/` (originals in `/data`). The user edits it in a spreadsheet and exports each tab as CSV with the same file name. Load with PapaParse (`header: true, dynamicTyping: true`), validate, and expose typed objects from `src/data/index.ts`.

## Files

**venues.csv**: one row per business.
`venue_id, name_en, name_ar, type, typical_guests, trend`
- `trend` multiplies the forecast for the recent direction (1.03 means guests are rising about 3%).

**dishes.csv**: one row per dish per venue.
`venue_id, dish_id, name_en, name_ar, service, station, grams_per_guest, cost_qar_per_kg`
- `service` is Breakfast, Lunch, Dinner or All day. `station` is Hot line, Grill, Cold, Bakery or Pastry.
- A dish's kg for N guests is `N × grams_per_guest / 1000`.

**history.csv**: one row per venue per day. This is what the model learns from.
`date, weekday, venue_id, period, guests_actual, guests_forecast, food_prepared_kg, food_wasted_kg, waste_pct`
- `period` is "Before Zad" or "With Zad". `guests_forecast` is empty before Zad.
- `waste_pct` = wasted ÷ prepared. Recompute it rather than trusting the column; in the spreadsheet it's a formula.

**weekday.csv**: `venue_id, weekday, factor`. This is a prior only. The live weekday effect should come from averaging `history.csv` by weekday.

**occasions.csv**: `occasion, guest_multiplier, appetite_multiplier, usual_overprep, dish_adjustments`
- `dish_adjustments` looks like `umm×1.3; luq×1.5; breakfast×0.45`. Parse it into `{ dishId | service: multiplier }`.
- `usual_overprep` is how much kitchens over-cook when they guess. It drives the "usual amount" baseline.

**leftovers.csv**: `date, venue_id, dish_id, left_kg, held_safely`. Only `held_safely = yes/TRUE` counts as donatable.

## Rules
- Validate on load. If a row is broken, skip it and show a small, plain warning on the `/data` page saying which file, which row and what's wrong. Never crash.
- Keep derived numbers (savings, accuracy, funnel) in pure functions in `src/data/derive.ts` with unit tests (Vitest).
- Money is `kg saved × weighted average cost per kg` for the venue.
- A meal is 0.45 kg. Use this constant only for "≈ meals" labels.
- Adding a new venue means adding rows to venues, dishes, history and weekday. The app should then show it in the venue switch with no code change.
