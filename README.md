# Zad · زاد

Zad predicts how much food a hotel buffet or a restaurant in Qatar needs **tomorrow**, dish by dish, so kitchens stop cooking by guesswork and waste less. Leftover food that was held safely can be offered to Hifz Al Naama (حفظ النعمة) with one tap (a demo: nothing is really sent).

A student research prototype. **All businesses and numbers are sample data.**

| Page | Route | For |
|---|---|---|
| About | `#about` | Judges: the story in under a minute, with a live "tomorrow's prep ticket" |
| Owner | `#owner` | The owner, on a phone, in Arabic: "Tomorrow, cook about X kg" |
| Kitchen | `#kitchen` | Head chef: tile dashboard, "Why this number?", model accuracy, leftover log |
| Data | `#data` | Every CSV as a table, data warnings, and a session-only CSV upload |

Arabic (RTL) is the default; English is one tap away. Venue, language and theme are remembered. It works offline after the first visit.

## Run it

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
```

```bash
npm run dev
```

Open the address it prints (usually http://localhost:5173).

Other commands:

| Command | What it does |
|---|---|
| `npm run build` | Type-checks and builds the site into `dist/` |
| `npm run preview` | Serves the built site on http://localhost:4173 (use this to test offline mode) |
| `npm test` | Runs the unit tests for the data and forecast maths |
| `npm run check` | The demo check: 32 screenshots into `checks/` (needs `npm run preview` running) |
| `npm run sync-data` | Copies `data/*.csv` into `public/data/` |

## Edit the data

Every number on screen is computed from the CSV files in `public/data/`. Nothing is hard-coded.

1. Edit the **Zad Dashboard Data** spreadsheet.
2. Download each tab as CSV with these names:

   | Tab | File |
   |---|---|
   | Daily history | `history.csv` |
   | Dishes | `dishes.csv` |
   | Venues | `venues.csv` |
   | Weekday pattern | `weekday.csv` |
   | Occasions | `occasions.csv` |
   | Leftovers today | `leftovers.csv` |
   | Settings | `settings.csv` |
   | Hifz locations | `hifz_locations.csv` |

3. Put them in `data/` and run `npm run sync-data` (or copy them straight into `public/data/`).
4. Reload the page. With `npm run dev` the change shows at once; on the live site, push and wait for the deploy.

Things to know:

- **"Tomorrow" is the day after the last date in `history.csv`**, so the demo works on any day. Add a row and tomorrow moves forward.
- Column names must stay the same. Dates are `YYYY-MM-DD`. `held_safely` accepts yes/no or TRUE/FALSE.
- If a row is broken, Zad skips it and the Data page says which file, which row and what is wrong. It never crashes.
- `history.csv` may have an optional `occasion` column (e.g. `national`). When it has some, the learned model also learns the occasion effect.
- A new venue only needs rows in `venues.csv`, `dishes.csv`, `history.csv` and `weekday.csv`. It then appears in the venue switch.
- `settings.csv` holds values the prototype used to hard-code: waste-source shares, the share of leftovers donated, tomorrow's temperature, the pickup time, and the Hifz Al Naama link (blank until a verified URL is added).
- `hifz_locations.csv` lists Hifz Al Naama locations for the "Contact the nearest location" map (Owner and Kitchen pages). `kind` is `pickup` (can be chosen as the nearest) or `office` (listed only). `maps_query` is what the Google Maps button searches for. `lat`/`lon` place the pin; venues need `lat`/`lon` in `venues.csv` too. Verify every row by phone: the current rows come from news articles and guides, and their pins are approximate to the area.
- To try a file without changing anything, use **Upload a CSV** on the Data page. It lasts until you close the tab.

## How the forecast works

Two methods, both in `src/forecast/`, both shown on the Kitchen page.

**1. Simple average (what the Owner sees).** Transparent, step by step:

```
typical  = average guests over the last 28 days
weekday  = average guests on the same weekday − typical
occasion = (typical + weekday) × (guest multiplier − 1)
weather  = restaurants only: +3% at 20–30°C, −1.2% per degree above 37°C
trend    = × venue trend
```

**2. Learned model (the machine learning).** A multiple linear regression fitted in the browser (normal equations, no library) on: day of week (6 one-hot features), days since start, is-occasion, and guests 7 days earlier. Its ridge strength is chosen by leave-one-out cross-validation on the training days only. It trains on all but the last 7 days and is scored on those 7 (MAPE and accuracy = 1 − MAPE), side by side with the simple average on the same days.

With three to four weeks of data the two are close, and on some venues the simple average wins. The Kitchen page says so honestly and explains why: the model has 9 features to estimate from about 14 training days, and it improves as history builds up.

**Kilograms per dish** = guests × grams per guest × appetite × dish adjustment × heat adjustment. "Usual" is what kitchens cook when they guess: typical guests × occasion × grams × usual over-prep.

## Deploy to GitHub Pages

1. Push this folder to a GitHub repository.
2. In the repository: **Settings → Pages → Source: GitHub Actions**.
3. Push to `main`. The workflow in `.github/workflows/deploy.yml` tests, builds and publishes the site to `https://<user>.github.io/<repo>/`.

To build for another host, set `BASE_PATH` to the folder the site lives in (default `/`).

## Before the competition

Run the demo check in `.claude/skills/zad-demo-check/SKILL.md`. Open the live site once on the presenting laptop and a phone so it is cached for offline use, and keep `npm run preview` as a backup.

Scripted path: About → Owner (change guests, pick National Day) → Kitchen ("Why this number?" and the model comparison) → donate button.

## Project layout

```
data/               editable CSVs (originals)
public/data/        CSVs the app loads
src/data/           CSV parsing, validation, derived numbers (savings, funnel)
src/forecast/       baseline, regression, kg per dish
src/i18n/           ar.ts, en.ts and number/date formatting
src/pages/          About, Owner, Kitchen, Data
src/components/     layout, charts (hand-made SVG), donate button
scripts/            demo check, data sync
reference/          the original single-file prototype
```
