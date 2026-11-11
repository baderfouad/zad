---
name: zad-forecast
description: How Zad predicts guests and kilograms per dish, how to measure accuracy, and how to explain it to judges. Use when writing or changing forecast code, the "Why this number?" panel, or the accuracy tile.
---

# Zad forecast

Two layers, both in `src/forecast/` as pure TypeScript functions with Vitest tests.

## 1. Guests tomorrow (explainable baseline)
```
typical   = mean(guests_actual) over the last 28 days for the venue
weekday   = mean(guests_actual on the same weekday) − typical
occasion  = (typical + weekday) × (guest_multiplier − 1)
weather   = restaurants only: +3% at 20–30°C, −1.2% per degree above 37°C
trend     = × venue.trend
expected  = round((typical + weekday + occasion) × weatherFactor × trend)
```
Show each step as a bar in the "Why this number?" waterfall. If the owner types their own number, use it, and show "You changed this; Zad expected N".

## 2. Real model (the machine-learning part)
Fit an ordinary least-squares **multiple linear regression** in the browser (no library is needed; solve the normal equations for 9 features):
- features: one-hot weekday (6), `days_since_start`, `is_occasion`, `lag_7_guests`
- target: `guests_actual`
- train on all but the last 7 days, test on the last 7, and report **MAPE** and **accuracy = 1 − MAPE**
- retrain on everything for the live prediction

Show the baseline and the regression side by side on the Kitchen page ("Simple average" vs "Learned model"), each with its own test-set accuracy. Judges like seeing that the learned model beats or matches the simple one, and why.

## 3. Kilograms per dish
```
fc_kg    = guests × grams_per_guest/1000 × appetite_multiplier × dish_adjustment × heat_adjustment
usual_kg = typical_guests × guest_multiplier × grams_per_guest/1000 × usual_overprep × dish_adjustment
range    = fc_kg × (1 ± u),  u = 0.07 (+0.05 on occasions, +0.02 for grill dishes)
```
- Heat adjustment: at 38°C or more, heavy dishes (ouzi, lamb, harees) ×0.85 and salad or fruit ×1.2.
- Ramadan: breakfast dishes ×0.45 (fasting).
- Buffet cooking plan: 60% at opening, then 20% twice, at +60 and +105 minutes.
- Restaurant plan: 45% lunch, 55% dinner.

## Explaining it in one breath (for the pitch)
"Zad looks at how many guests came on each day of the week, adjusts for occasions like Ramadan or National Day, and learns from its own mistakes every day. Over the last two weeks it was about 97% accurate on guest numbers, which let the kitchen cook about 60 kg less food a day."
Always recompute these numbers from the data before the pitch.
