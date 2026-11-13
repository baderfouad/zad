import { fill, fmtDate } from '../i18n/format';
import type { VenueView } from '../forecast';
import { useApp } from '../state/AppState';

/** Tomorrow's prep as a kitchen order slip (About hero). Live from the forecast. */
export function Ticket({ v }: { v: VenueView }) {
  const { t, n, lang } = useApp();
  const top = [...v.plan].sort((a, b) => b.fcKg - a.fcKg);
  const shown = top.slice(0, 5);
  const diff = v.usualKg - v.totalKg;
  return (
    <div className="ticket-wrap">
      <section className="ticket" aria-labelledby="tk-h" aria-live="polite">
        <div className="tk-head">
          <h2 id="tk-h">{t.tkHead}</h2>
          <span>
            {lang === 'ar' ? v.venue.nameAr : v.venue.nameEn}
            <br />
            {fmtDate(lang, v.target, { weekday: 'long', day: 'numeric', month: 'long' })} · {fill(t.tkGuests, { n: n(v.guests) })}
          </span>
        </div>
        <ul className="tk-lines">
          {shown.map((p) => (
            <li key={p.dish.id}>
              <span>{lang === 'ar' ? p.dish.nameAr : p.dish.nameEn}</span>
              <span className="dots" aria-hidden="true" />
              <span className="q num">{n(p.fcKg, 1)} {t.kg}</span>
            </li>
          ))}
        </ul>
        {top.length > shown.length && <div className="tk-more">{fill(t.tkMore, { n: n(top.length - shown.length) })}</div>}
        <div className="tk-total">
          <span>{t.tkTotal}</span>
          <b className="num">{n(v.totalKg)} {t.kg}</b>
        </div>
        <div className={'tk-stamp' + (diff < 0 ? ' busy' : '')}>
          {diff >= 0 ? fill(t.tkLess, { kg: n(diff) }) : fill(t.tkMoreKg, { kg: n(-diff) })}
        </div>
      </section>
    </div>
  );
}
