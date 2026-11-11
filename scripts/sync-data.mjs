// Copies the editable CSVs from data/ into public/data/ so the app serves them.
import { cpSync, mkdirSync, readdirSync } from 'node:fs';
mkdirSync('public/data', { recursive: true });
for (const f of readdirSync('data').filter((f) => f.endsWith('.csv'))) {
  cpSync(`data/${f}`, `public/data/${f}`);
  console.log(`data/${f} -> public/data/${f}`);
}
