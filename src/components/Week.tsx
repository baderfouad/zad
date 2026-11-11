import { Rich } from './Rich';
import type { WeekDay } from '../forecast';
import { fill, weekdayName } from '../i18n/format';
import { useApp } from '../state/AppState';

/** Expected guests for the next 7 days. Time axis stays left-to-right (zad-brand RTL rule). */
export function Week({ days }: { days: WeekDay[] }) {
  const { t, n, lang } = useApp();
  const max = Math.max(...days.map((d) => d.hi), 1);
  const peak = days.reduce((a, d) => (d.guests > a.guests ? d : a), days[0]);
  return (
    <>
      <ol className="week" dir="ltr" aria-label={t.weekH} style={{ padding: 0, margin: "10px 0 0" }}>
        {days.map((d) => {
          const cls = ['col', d.isTomorrow ? 'tm' : '', d === peak && !d.isTomorrow ? 'peak' : ''].join(' ');
          return (
            <li key={d.date} className={cls} style={{ listStyle: 'none' }}>
              <span className="g num" dir="auto">{n(d.guests)}</span>
              <div className="barbox" aria-hidden="true">
                <div className="bar" style={{ height: `${(d.guests / max) * 100}%` }} />
                <div className="range" style={{ bottom: `${(d.lo / max) * 100}%`, height: `${((d.hi - d.lo) / max) * 100}%` }} />
              </div>
              <span className="day" dir="auto">
                {d.isTomorrow ? t.weekTomorrow : weekdayName(lang, d.date, 'short')}
                <span className="sr">: {n(d.guests)} {t.guests}, {n(d.lo)}–{n(d.hi)}</span>
              </span>
            </li>
          );
        })}
      </ol>
      <p className="wpeak"><Rich s={t.weekPeak} v={{ d: weekdayName(lang, peak.date), n: n(peak.guests) }} /></p>
      <p className="note">{fill(t.lgRange, {})}: {n(days[0].lo)}–{n(days[0].hi)} ({t.weekTomorrow})</p>
    </>
  );
}
