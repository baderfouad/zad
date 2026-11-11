import { readFileSync } from 'node:fs';
import { buildData, parseCsv } from './data/parse';
import { FILES, type FileName, type RawTable } from './data/types';

/** Loads the real CSVs from public/data, optionally replacing some files' text. */
export function loadFixture(replace: Partial<Record<FileName, string>> = {}) {
  const raw = Object.fromEntries(
    FILES.map((f) => [f, parseCsv(replace[f] ?? readFileSync(`public/data/${f}.csv`, 'utf8'))]),
  ) as Record<FileName, RawTable>;
  return buildData(raw);
}
export const csv = (f: FileName) => readFileSync(`public/data/${f}.csv`, 'utf8');
