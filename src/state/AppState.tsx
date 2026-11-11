import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { loadData, type FileName, type ZadData } from '../data';
import { latestLeftovers, type LeftoverEntry } from '../data/derive';
import { ar, type Dict } from '../i18n/ar';
import { en } from '../i18n/en';
import { fmtNum, fmtPct, fmtSigned, type Lang } from '../i18n/format';
import type { Scenario } from '../forecast';

type Theme = 'light' | 'dark';

const store = {
  get(k: string) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* storage blocked */ } },
};
const session = {
  get<T>(k: string, fallback: T): T { try { const v = sessionStorage.getItem(k); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; } },
  set(k: string, v: unknown) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked */ } },
};

interface Donation { kg: number; at: number }

interface AppCtx {
  lang: Lang; setLang: (l: Lang) => void;
  theme: Theme; toggleTheme: () => void;
  venueId: string; setVenueId: (v: string) => void;
  t: Dict;
  n: (x: number, d?: number) => string;
  pct: (x: number, d?: number) => string;
  signed: (x: number, d?: number) => string;
  data: ZadData | null; error: string | null;
  reload: (uploads?: Partial<Record<FileName, string>>) => Promise<void>;
  scenario: Scenario; setScenario: (p: Partial<Scenario>) => void;
  log: LeftoverEntry[]; logDate: string | null;
  setLogEntry: (dishId: string, p: Partial<LeftoverEntry>) => void; resetLog: () => void;
  donation: Donation | null; donate: (kg: number) => void; undoDonation: () => void;
}

const Ctx = createContext<AppCtx | null>(null);

const DEFAULT_SCENARIO: Scenario = { occasion: 'none', guests: null, tempC: null };

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangS] = useState<Lang>(() => (store.get('zad-lang') === 'en' ? 'en' : 'ar'));
  const [theme, setTheme] = useState<Theme>(() => {
    const s = store.get('zad-theme');
    if (s === 'light' || s === 'dark') return s;
    try { return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; } catch { return 'light'; }
  });
  const [venuePref, setVenuePref] = useState<string>(() => store.get('zad-venue') ?? '');
  const [data, setData] = useState<ZadData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scenarios, setScenarios] = useState<Record<string, Scenario>>(() => session.get('zad-scenarios', {}));
  const [logs, setLogs] = useState<Record<string, LeftoverEntry[]>>(() => session.get('zad-logs', {}));
  const [donations, setDonations] = useState<Record<string, Donation | null>>(() => session.get('zad-donations', {}));

  const reload = useCallback(async (uploads?: Partial<Record<FileName, string>>) => {
    try { setData(await loadData(uploads)); setError(null); } catch (e) { setError(String(e)); }
  }, []);
  useEffect(() => { void reload(); }, [reload]);

  useEffect(() => {
    const el = document.documentElement;
    el.lang = lang; el.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.title = lang === 'ar' ? 'زاد · توقّع طعام الغد' : 'Zad · Tomorrow’s food forecast';
  }, [lang]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#1E1611' : '#ECE3D1');
  }, [theme]);
  useEffect(() => session.set('zad-scenarios', scenarios), [scenarios]);
  useEffect(() => session.set('zad-logs', logs), [logs]);
  useEffect(() => session.set('zad-donations', donations), [donations]);

  const venueId = data?.venues.some((v) => v.id === venuePref) ? venuePref : data?.venues[0]?.id ?? venuePref;
  const dishes = useMemo(() => data?.dishes.filter((d) => d.venueId === venueId) ?? [], [data, venueId]);
  const fileLog = useMemo(() => (data ? latestLeftovers(data.leftovers, venueId, dishes) : { date: null, entries: [] }), [data, venueId, dishes]);
  // keep the session log in step with the dish list (new dishes appear, removed ones disappear)
  const log = useMemo(() => {
    const mine = logs[venueId];
    if (!mine) return fileLog.entries;
    return fileLog.entries.map((e) => mine.find((m) => m.dishId === e.dishId) ?? e);
  }, [logs, venueId, fileLog]);

  const value = useMemo<AppCtx>(() => {
    const t = lang === 'ar' ? ar : en;
    return {
      lang, t, theme, venueId, data, error, reload, log, logDate: fileLog.date,
      setLang: (l) => { setLangS(l); store.set('zad-lang', l); },
      toggleTheme: () => setTheme((th) => { const nx = th === 'dark' ? 'light' : 'dark'; store.set('zad-theme', nx); return nx; }),
      setVenueId: (v) => { setVenuePref(v); store.set('zad-venue', v); },
      n: (x, d = 0) => fmtNum(lang, x, d),
      pct: (x, d = 0) => fmtPct(lang, x, d),
      signed: (x, d = 0) => fmtSigned(lang, x, d),
      scenario: scenarios[venueId] ?? DEFAULT_SCENARIO,
      setScenario: (p) => setScenarios((s) => ({ ...s, [venueId]: { ...(s[venueId] ?? DEFAULT_SCENARIO), ...p } })),
      setLogEntry: (dishId, p) => setLogs((s) => ({ ...s, [venueId]: log.map((e) => (e.dishId === dishId ? { ...e, ...p } : e)) })),
      resetLog: () => setLogs((s) => { const c = { ...s }; delete c[venueId]; return c; }),
      donation: donations[venueId] ?? null,
      donate: (kg) => setDonations((s) => ({ ...s, [venueId]: { kg, at: Date.now() } })),
      undoDonation: () => setDonations((s) => ({ ...s, [venueId]: null })),
    };
  }, [lang, theme, venueId, data, error, reload, log, fileLog.date, scenarios, donations]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useApp outside AppProvider');
  return c;
}
