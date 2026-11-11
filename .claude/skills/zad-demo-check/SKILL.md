---
name: zad-demo-check
description: Pre-demo quality check for the Zad app (screens, languages, themes, data, offline, console). Use before calling any page done and before the competition presentation.
---

# Zad demo check

Run `npm run build && npm run preview`, then use Playwright (install it as a dev dependency if missing) to screenshot each route at **375×812** and **1280×800**, in **Arabic and English**, **light and dark**. That's 4 routes × 2 sizes × 2 languages × 2 themes = 32 shots, saved in `checks/`. Look at them and fix what you see before reporting.

## Must pass
- [ ] No console errors or warnings on any route.
- [ ] No horizontal scroll at 375px (`document.documentElement.scrollWidth === innerWidth`).
- [ ] Arabic is RTL, digits are Arabic-Indic, and dates are Gregorian.
- [ ] Every number on screen traces to the CSVs. Change one value in `public/data/history.csv`, reload, and confirm the KPI changes.
- [ ] Owner page: the answer card is readable on a phone without scrolling past it.
- [ ] Hifz Al Naama button: it shows the demo notice and Undo works.
- [ ] Offline: load once, switch the network off in DevTools, reload, and everything still works.
- [ ] Lighthouse: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95.
- [ ] Keyboard only: you can reach and use every control, and focus is always visible.
- [ ] The "sample data" note is visible on the Owner and Kitchen pages.

## Demo-day extras
- Pre-load the deployed site on the presenting laptop and a phone. Keep a local `npm run preview` as backup.
- Set the date logic so "tomorrow" always works. Never hard-code a date.
- Prepare one scripted click path: About, then Owner (change guests, pick National Day), then Kitchen (show "Why this number?" and accuracy), then the donate button.
