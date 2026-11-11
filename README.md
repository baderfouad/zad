# Zad starter kit for Claude Code

1. Install Claude Code and open a terminal in this folder.
2. Run `git init`, then `claude`.
3. Paste the prompt from `PROMPT.md`. Claude reads `CLAUDE.md` and the skills in `.claude/skills/` by itself.

## What's here
- `PROMPT.md`: the build prompt.
- `CLAUDE.md`: project rules Claude follows every session.
- `.claude/skills/`: four project skills.
  - `zad-brand`: colors, fonts and layout.
  - `zad-data`: what each CSV means.
  - `zad-forecast`: the prediction model and how to explain it.
  - `zad-demo-check`: a test checklist before the competition.
- `data/`: the sample data as CSV, one file per tab of the "Zad Dashboard Data" sheet.
- `reference/zad-prototype.html`: the current single-file prototype. Open it in a browser.

## Changing the data
Edit the sheet, download each tab as CSV and save it under these names: Daily history → history.csv, Dishes → dishes.csv, Venues → venues.csv, Weekday pattern → weekday.csv, Occasions → occasions.csv, Leftovers today → leftovers.csv. Then replace the files in `public/data/` of the built app.
