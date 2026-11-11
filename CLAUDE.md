# Zad (زاد): project rules for Claude

Zad predicts tomorrow's food needs for hotel buffets and restaurants in Qatar, to cut food waste. It is a student research prototype for a competition. All businesses and numbers are sample data, and the UI must say so in small text.

## Always
- Arabic first (RTL, `lang="ar"`), English second. Every string lives in `src/i18n/ar.ts` and `src/i18n/en.ts`, never inline.
- Numbers come from `public/data/*.csv` through `src/data/`. Never hard-code a figure that exists in the data.
- Use the `zad-brand` skill for anything visual, `zad-data` for anything that reads data, `zad-forecast` for predictions, and `zad-demo-check` before saying a page is done.
- Owner screens: big type, one idea per block, plain words, touch targets of at least 48px.
- Kitchen screens: dense tiles, and every number has a label and a unit (kg, QAR, guests, %).
- Ask before adding a dependency over 50 KB gzipped.

## Never
- Never invent statistics about Qatar, food waste or Hifz Al Naama. If a real figure is needed, leave a `TODO(source)` and tell me.
- Never claim a donation was really sent. The Hifz Al Naama button is a demo and must say so.
- No emoji as icons, no purple gradients, no ALL-CAPS labels, no generic "SaaS card" look.

## Commands
- `npm run dev` starts the dev server.
- `npm run build` must pass before any commit.
- `npm run preview` previews the production build.
