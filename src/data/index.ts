import { buildData, parseCsv } from './parse';
import { FILES, type FileName, type RawTable, type ZadData } from './types';

export * from './types';
export { setting, numSetting, detectFile, parseCsv, REQUIRED_COLUMNS } from './parse';

const OVERRIDE_KEY = (f: FileName) => `zad-upload-${f}`;

function readOverride(f: FileName): string | null {
  try { return sessionStorage.getItem(OVERRIDE_KEY(f)); } catch { return null; }
}
export function saveOverride(f: FileName, text: string) {
  try { sessionStorage.setItem(OVERRIDE_KEY(f), text); } catch { /* private mode: upload lasts until reload */ }
}
export function clearOverrides() {
  try { FILES.forEach((f) => sessionStorage.removeItem(OVERRIDE_KEY(f))); } catch { /* ignore */ }
}

const EMPTY: RawTable = { headers: [], rows: [] };

/** Loads every CSV from public/data (or from this session's uploads), validates and returns typed data. */
export async function loadData(extra: Partial<Record<FileName, string>> = {}): Promise<ZadData> {
  const base = import.meta.env.BASE_URL;
  const overridden: FileName[] = [];
  const texts = await Promise.all(
    FILES.map(async (f) => {
      const up = extra[f] ?? readOverride(f);
      if (up !== null && up !== undefined) { overridden.push(f); return up; }
      try {
        const res = await fetch(`${base}data/${f}.csv`, { cache: 'no-cache' });
        if (!res.ok) return null;
        return await res.text();
      } catch { return null; }
    }),
  );
  const raw = Object.fromEntries(FILES.map((f, i) => [f, texts[i] === null ? EMPTY : parseCsv(texts[i]!)])) as Record<FileName, RawTable>;
  const data = buildData(raw, overridden);
  FILES.forEach((f, i) => {
    if (texts[i] === null) data.warnings.unshift({ file: f, row: 0, message: `couldn't load ${f}.csv` });
  });
  return data;
}
