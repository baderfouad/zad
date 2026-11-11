# Prompt to paste into Claude Code

> Open Claude Code inside the `zad` folder (the one that holds this file, `CLAUDE.md`, `data/`, `reference/` and `.claude/skills/`), then paste everything below the line.
> Tip: press Shift+Tab twice first to start in **plan mode**, so Claude shows you the plan before writing code.

---

Build **Zad (زاد)**, a competition-grade web app that predicts how much food a hotel buffet or a restaurant in Qatar needs tomorrow, and cuts food waste.

## Read first
1. `CLAUDE.md` for the project rules.
2. The skills in `.claude/skills/`: `zad-brand`, `zad-data`, `zad-forecast` and `zad-demo-check`. Use them throughout.
3. `data/*.csv`, the sample data. It is exported from the "Zad Dashboard Data" spreadsheet I keep, and I will edit it, so the app must read these files rather than hard-code numbers.
4. `reference/zad-prototype.html`, a working single-file prototype. Keep its ideas and Arabic/English copy. Don't copy its code structure.

Before you write code, ask me about anything you're unsure of, with multiple-choice options where you can.

## Who uses it
- **Owner** (صاحب المنشأة): not technical, on a phone, in Arabic. They need one clear answer: "Tomorrow, cook about X kg." They also need the guests to expect, what to tell the kitchen, money saved, and a one-tap donation to Hifz Al Naama (حفظ النعمة).
- **Head chef / F&B manager** (المطبخ): on a laptop or tablet. They need a tile dashboard in the style of a Power BI report: KPI tiles, guests this week, prep by dish, a "where the food went" funnel, waste sources, daily waste before and after Zad, forecast accuracy, and a leftover log.
- **Competition judges**: a laptop or projector. They need an About page that tells the story from my slides in under 60 seconds.

## Pages (hash or router routes)
1. `/` **About**: hero, a live "tomorrow's prep ticket", two doors (Owner / Kitchen), problem, solution, how it works (4 steps), the Hifz Al Naama link, benefits, and Qatar National Vision 2030.
2. `/owner` **Owner view**: big answer card; guest stepper with Zad's suggested number; special-day chips (normal, Ramadan, Eid, National Day, event); expected guests for the next 7 days; dish list; savings; leftovers with a donate button.
3. `/kitchen` **Kitchen dashboard**: the tile grid described above. It also needs an editable leftover log whose total feeds the Owner's donate button, and a "Why this number?" panel that breaks the guest forecast into typical day, weekday effect, occasion, weather and trend.
4. `/data` **Data**: a simple table viewer for each CSV, plus a button to upload a new CSV for a session. That shows judges the app runs on data, not on fixed numbers.

A switch for **venue** (hotel / restaurant) and **language** (Arabic RTL default / English LTR) appears on every page and is remembered.

## Forecast
Follow `zad-forecast`: a transparent baseline (weekday averages × occasion × weather × trend), plus a real fitted model (multiple linear regression on the history) that also reports accuracy (MAPE) on held-out days. Show both on the Kitchen page so I can explain the machine learning to the judges.

## Technical
- Vite + React + TypeScript. CSS variables for theming (no UI kit look), Recharts or hand-made SVG for charts, PapaParse for CSV.
- No backend. Data goes in `public/data/`. It must work offline once loaded, because Wi-Fi at the venue may fail; add a PWA manifest and service worker.
- Light and dark themes. Fully responsive at 375px. RTL correct, including charts and number formats (Arabic-Indic digits in Arabic).
- Accessible: real buttons and labels, visible focus, contrast AA, `prefers-reduced-motion`.
- Deploy script for GitHub Pages or Netlify, and a README explaining how to run, edit the data and deploy.

## Done means
- `npm run build` passes with no TypeScript errors.
- The `zad-demo-check` skill passes: every page at 375px and 1280px in both languages and both themes, no console errors, numbers match the CSVs.
- Changing a value in `data/history.csv` changes the dashboards after a reload.

Work in small steps, commit after each page, and show me screenshots of each page as you finish it.
