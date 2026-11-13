import type { VenueView } from '../forecast';
import { fill, fmtDate } from '../i18n/format';
import { useApp } from '../state/AppState';

/** What's coming up in Qatar's calendar, its expected effect on guests, and a button to plan that day. */
export function Upcoming({ v, compact = false }: { v: VenueView; compact?: boolean }) {
  const { t, n, lang, data, setScenario, signed } = useApp();
  if (!v.upcoming.length) return <p className="note">{t.calNone}</p>;
  const range = (a: string, b: string) => {
    const f = (d: string) => fmtDate(lang, d, { day: 'numeric', month: 'long' });
    return a === b ? f(a) : `${f(a)} – ${f(b)}`;
  };
  return (
    <ul className={'cal' + (compact ? ' compact' : '')}>
      {v.upcoming.map((u) => {
        const occ = data?.occasions.find((o) => o.id === u.event.occasion);
        const pctUp = occ ? (occ.guestMultiplier - 1) * 100 : 0;
        const active = v.target === u.planDate;
        return (
          <li key={u.event.from + u.event.nameEn} className={active ? 'on' : ''}>
            <div className="cal-when">
              <b className="num">{u.ongoing ? t.calNow : u.startsIn === 1 ? t.calTomorrow : fill(t.calIn, { n: n(u.startsIn) })}</b>
              <span>{range(u.event.from, u.event.to)}</span>
            </div>
            <div className="cal-what">
              <h3>{lang === 'ar' ? u.event.nameAr : u.event.nameEn}</h3>
              <p>
                {occ && pctUp !== 0 && <span className="pill good">{fill(t.calEffect, { p: signed(pctUp) + (lang === 'ar' ? '٪' : '%') })}</span>}{' '}
                {!u.event.confirmed && <span className="note">{t.calExpected}</span>}
                {u.event.source && <> · <a className="note" href={u.event.source} target="_blank" rel="noopener noreferrer">{t.calSource}</a></>}
              </p>
            </div>
            <button type="button" className="btn ghost" aria-pressed={active}
              onClick={() => { setScenario({ target: u.planDate, occasion: null, guests: null }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
              {t.calPlan}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
