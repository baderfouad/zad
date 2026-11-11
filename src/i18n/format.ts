export type Lang = 'ar' | 'en';

const nfCache = new Map<string, Intl.NumberFormat>();
const locale = (lang: Lang) => (lang === 'ar' ? 'ar-QA-u-nu-arab' : 'en-US');

export function fmtNum(lang: Lang, n: number, digits = 0): string {
  const key = lang + digits;
  let f = nfCache.get(key);
  if (!f) {
    f = new Intl.NumberFormat(locale(lang), { maximumFractionDigits: digits, minimumFractionDigits: digits });
    nfCache.set(key, f);
  }
  return f.format(Number.isFinite(n) ? n : 0);
}

/** 0.123 → "12%" / "١٢٪" */
export const fmtPct = (lang: Lang, share: number, digits = 0) =>
  fmtNum(lang, share * 100, digits) + (lang === 'ar' ? '٪' : '%');

/** Signed number, e.g. "+12" / "−3" (true minus sign). */
export const fmtSigned = (lang: Lang, n: number, digits = 0) => {
  const r = Number(n.toFixed(digits));
  return (r > 0 ? '+' : r < 0 ? '−' : '') + fmtNum(lang, Math.abs(r), digits);
};

/** Replaces Western digits inside free text, e.g. "+60" in a label. */
export const digits = (lang: Lang, s: string) =>
  lang === 'ar' ? s.replace(/\d/g, (c) => '٠١٢٣٤٥٦٧٨٩'[+c]) : s;

/** Dates: always Gregorian, Arabic-Indic digits in Arabic. Input is an ISO date (YYYY-MM-DD). */
export function fmtDate(lang: Lang, iso: string, opts: Intl.DateTimeFormatOptions): string {
  const d = new Date(iso + 'T12:00:00Z');
  return d.toLocaleDateString(lang === 'ar' ? 'ar-QA-u-ca-gregory-nu-arab' : 'en-GB', { timeZone: 'UTC', ...opts });
}
export const weekdayName = (lang: Lang, iso: string, style: 'long' | 'short' = 'long') => fmtDate(lang, iso, { weekday: style });

/** "22:30" → "10:30 pm" / "١٠:٣٠ م" */
export function fmtTime(lang: Lang, hhmm: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return digits(lang, hhmm);
  const d = new Date(Date.UTC(2026, 0, 1, +m[1], +m[2]));
  return d.toLocaleTimeString(lang === 'ar' ? 'ar-QA-u-nu-arab' : 'en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });
}

/** Fills {name} placeholders. */
export const fill = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
