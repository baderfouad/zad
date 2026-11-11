/** Dates are handled as ISO strings (YYYY-MM-DD) in UTC so time zones never shift a day. */
export const addDays = (iso: string, n: number): string => {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
export const dayDiff = (a: string, b: string): number =>
  Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 864e5);
export const weekdayOfIso = (iso: string): number => new Date(iso + 'T00:00:00Z').getUTCDay();
export const toDate = (iso: string): Date => new Date(iso + 'T12:00:00Z');
