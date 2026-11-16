import { House, Pot } from '../components/Icons';
import { Rich } from '../components/Rich';
import { Ticket } from '../components/Ticket';
import { setting } from '../data';
import { useApp } from '../state/AppState';
import { href } from '../state/useRoute';
import { useVenueView } from '../state/useVenueView';

export function About() {
  const { t, n, pct, lang, data } = useApp();
  const v = useVenueView();
  const hifzUrl = data && v ? setting(data, 'hifz_url', v.venue.id) : undefined;

  return (
    <div className="wrap about">
      <section className="hero" aria-labelledby="hero-h">
        <div className="hero-text">
          <h1 id="hero-h">{t.hTitle}</h1>
          <p className="lead">{t.hLead}</p>
          {v && v.savings.daysWithZad > 0 && v.savings.daysBefore > 0 && (
            <p className="proof">
              <Rich s={t.proofP.replace('{a}', '<b class="up">{a}</b>').replace('{b}', '<b>{b}</b>')} v={{
                days: n(v.savings.daysWithZad),
                venue: lang === 'ar' ? v.venue.nameAr : v.venue.nameEn,
                a: pct(v.savings.rateBefore), b: pct(v.savings.rateWith),
              }} />
              <small>{t.demo}</small>
            </p>
          )}
          <nav className="doors" aria-label={t.navLabel}>
            <a className="door primary" href={href('owner')}>
              <House />
              <span><b>{t.doorOwnerH}</b><small>{t.doorOwnerP}</small></span>
            </a>
            <a className="door" href={href('kitchen')}>
              <Pot />
              <span><b>{t.doorKitchenH}</b><small>{t.doorKitchenP}</small></span>
            </a>
          </nav>
        </div>
        {v ? <Ticket v={v} /> : <p className="note">{t.noData}</p>}
      </section>

      <section className="about-sec ps">
        <div><h2>{t.problemH}</h2><p>{t.problemP}</p></div>
        <div><h2>{t.solutionH}</h2><p>{t.solutionP}</p></div>
      </section>

      <section className="about-sec" aria-labelledby="how-h">
        <h2 id="how-h">{t.howH}</h2>
        <ol className="seq">
          {t.steps.map((s, i) => (
            <li key={i}>
              <span className="n num" aria-hidden="true">{n(i + 1)}</span>
              <h3>{s.h}</h3>
              <p>{s.p}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="about-sec ps">
        <div>
          <h2>{t.hifzH}</h2>
          <p>{t.hifzLine}</p>
          {hifzUrl && <p><a href={hifzUrl} target="_blank" rel="noopener noreferrer">{t.hifzLink}</a></p>}
        </div>
        <div><h2>{t.visionH}</h2><p>{t.visionLine}</p></div>
      </section>
    </div>
  );
}
