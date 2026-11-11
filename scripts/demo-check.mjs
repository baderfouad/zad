// zad-demo-check: screenshots every route at 375 and 1280 px, in Arabic and English, light and dark.
// Usage: npm run build && npm run preview   (in another terminal)
//        npm run check                       (all 32 shots)
//        npm run check -- owner kitchen      (only some routes)
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = await import('playwright')); }

const BASE = process.env.ZAD_URL ?? 'http://localhost:4173/';
const all = ['about', 'owner', 'kitchen', 'data'];
const routes = process.argv.slice(2).filter((a) => all.includes(a));
const sizes = [{ w: 375, h: 812 }, { w: 1280, h: 800 }];
const langs = ['ar', 'en'];
const themes = ['light', 'dark'];
const full = !process.env.ZAD_FOLD; // ZAD_FOLD=1 shoots only the first screen

mkdirSync('checks', { recursive: true });
const browser = await chromium.launch();
const problems = [];
let shots = 0;
for (const route of routes.length ? routes : all) {
  for (const s of sizes) for (const lang of langs) for (const theme of themes) {
    const ctx = await browser.newContext({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: 1, colorScheme: theme });
    await ctx.addInitScript(([l, th]) => { localStorage.setItem('zad-lang', l); localStorage.setItem('zad-theme', th); }, [lang, theme]);
    const page = await ctx.newPage();
    const tag = `${route}-${s.w}-${lang}-${theme}`;
    page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) problems.push(`${tag}: console ${m.type()}: ${m.text()}`); });
    page.on('pageerror', (e) => problems.push(`${tag}: page error: ${e.message}`));
    await page.goto(BASE + (route === 'about' ? '#/' : `#/${route}`), { waitUntil: 'networkidle' });
    await page.waitForSelector('main h1', { timeout: 10000 }).catch(() => problems.push(`${tag}: no h1 rendered`));
    await page.evaluate(() => document.fonts.ready);
    const m = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth, iw: innerWidth, dir: document.documentElement.dir,
      latin: document.querySelector('main')?.innerText.match(/[0-9]/g)?.length ?? 0,
    }));
    if (m.sw > m.iw) problems.push(`${tag}: horizontal scroll (${m.sw} > ${m.iw})`);
    if (m.dir !== (lang === 'ar' ? 'rtl' : 'ltr')) problems.push(`${tag}: dir is ${m.dir}`);
    if (lang === 'ar' && m.latin > 0 && route !== 'data') problems.push(`${tag}: ${m.latin} Western digits in Arabic page`);
    await page.screenshot({ path: `checks/${tag}.png`, fullPage: full });
    shots++;
    await ctx.close();
  }
}
await browser.close();
console.log(`${shots} screenshots in checks/`);
if (problems.length) { console.log('Problems:\n' + problems.join('\n')); process.exitCode = 1; } else console.log('No problems found.');
