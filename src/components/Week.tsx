import { Rich } from './Rich';
import type { WeekDay } from '../forecast';
import { fill, fmtDate, weekdayName } from '../i18n/format';
import { useApp } from '../state/AppState';

/** Expected guests for 7 days. Time axis stays left-to-right (zad-brand RTL rule). Weekends shaded, calendar days marked. */
export function Week({ days }: { days: WeekDay[] }) {
  const { t, n, lang, data } = useApp();
  const max = Math.max(...days.map((d) => d.hi), 1);
  const peak = days.reduce((a, d) => (d.guests > a.guests ? d : a), days[0]);
  const events = days.filter((d) => d.occasion !== 'none');
  const evName = (d: WeekDay) => {
    const e = data?.calendar.find((c) => c.from <= d.date && d.date <= c.to && c.occasion === d.occasion);
    return e ? (lang === 'ar' ? e.nameAr : e.nameEn) : t.occ[d.occasion] ?? d.occasion;
  };
  return (
    <>
      <ol className="week" dir="ltr" aria-label={t.weekH} style={{ padding: 0, margin: '10px 0 0' }}>
        {days.map((d) => {
          const cls = ['col', d.isFirst ? 'tm' : '', d === peak && !d.isFirst ? 'peak' : '', d.weekend ? 'we' : '', d.occasion !== 'none' ? 'ev' : ''].join(' ');
          return (
            <li key={d.date} className={cls} style={{ listStyle: 'none' }}>
              <span className="g num" dir="auto">{n(d.guests)}</span>
              <div className="barbox" aria-hidden="true">
                <div className="bar" style={{ height: `${(d.guests / max) * 100}%` }} />
                <div className="range" style={{ bottom: `${(d.lo / max) * 100}%`, height: `${((d.hi - d.lo) / max) * 100}%` }} />
              </div>
              <span className="day" dir="auto">
                {d.isTomorrow ? t.weekTomorrow : weekdayName(lang, d.date, 'short')}
                <small className="dnum">{fmtDate(lang, d.date, { day: 'numeric', month: 'numeric' })}</small>
                <span className="sr">: {n(d.guests)} {t.guests}, {n(d.lo)}–{n(d.hi)}{d.weekend ? `, ${t.weekend}` : ''}{d.occasion !== 'none' ? `, ${evName(d)}` : ''}</span>
              </span>
            </li>
          );
        })}
      </ol>
      <div className="legend week-legend">
        <span><i className="we-sw" />{t.weekend}</span>
        {events.length > 0 && <span><i className="ev-sw" />{fill(t.calWeekEvents, { e: [...new Set(events.map(evName))].join(lang === 'ar' ? '، ' : ', ') })}</span>}
      </div>
      <p className="wpeak"><Rich s={t.weekPeak} v={{ d: weekdayName(lang, peak.date), n: n(peak.guests) }} /></p>
      <p className="note">{t.lgRange}: {n(days[0].lo)}–{n(days[0].hi)} ({days[0].isTomorrow ? t.weekTomorrow : weekdayName(lang, days[0].date)})</p>
    </>
  );
}
