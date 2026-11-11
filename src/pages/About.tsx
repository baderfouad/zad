import { Bin, Coin, Eye, Hand, House, Leaf, Pot, Screen, Truck } from '../components/Icons';
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
  const benefitIcons = [<Coin key="c" />, <Bin key="b" />, <Leaf key="l" />, <Screen key="s" />];
  const hifzIcons = [<Eye key="e" />, <Truck key="t" />, <Hand key="h" />];

  return (
    <div className="wrap">
      <section className="hero" aria-labelledby="hero-h">
        <div>
          <h1 id="hero-h">{t.hTitle}</h1>
          <p className="lead">{t.hLead}</p>
          <p className="sub">{t.hSub}</p>
          {v && v.savings.daysWithZad > 0 && v.savings.daysBefore > 0 && (
            <p className="proof">
              <strong>{t.proofH}:</strong>
              <span>
                <Rich s={t.proofP.replace('{a}', '<b class="up">{a}</b>').replace('{b}', '<b>{b}</b>')} v={{
                  days: n(v.savings.daysWithZad),
                  venue: lang === 'ar' ? v.venue.nameAr : v.venue.nameEn,
                  a: pct(v.savings.rateBefore), b: pct(v.savings.rateWith),
                }} />
              </span>
            </p>
          )}
        </div>
        {v ? <Ticket v={v} /> : <p className="note">{t.noData}</p>}
      </section>

      <nav className="doors" aria-label={t.navLabel}>
        <a className="door owner" href={href('owner')}>
          <House />
          <h2>{t.doorOwnerH}</h2>
          <p>{t.doorOwnerP}</p>
          <span className="go">{t.doorOwnerB}</span>
        </a>
        <a className="door kitchen" href={href('kitchen')}>
          <Pot />
          <h2>{t.doorKitchenH}</h2>
          <p>{t.doorKitchenP}</p>
          <span className="go">{t.doorKitchenB}</span>
        </a>
      </nav>

      <section className="about-sec">
        <div className="ps">
          <div><h2 className="bad">{t.problemH}</h2><p>{t.problemP}</p></div>
          <div><h2 className="good">{t.solutionH}</h2><p>{t.solutionP}</p></div>
        </div>
      </section>

      <section className="about-sec" aria-labelledby="how-h">
        <h2 id="how-h">{t.howH}</h2>
        <ol className="seq">
          {t.steps.map((s, i) => (
            <li key={i}>
              <div className="n num" aria-hidden="true">{n(i + 1)}</div>
              <h3>{s.h}</h3>
              <p>{s.p}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="about-sec hifz" aria-labelledby="hifz-h">
        <h2 id="hifz-h">{t.hifzH}</h2>
        <ol className="seq three">
          {t.hifzSteps.map((s, i) => (
            <li key={i}>{hifzIcons[i]}<h3>{s.h}</h3><p>{s.p}</p></li>
          ))}
        </ol>
        <div className="foot-note">
          {hifzUrl && <a className="btn palm" href={hifzUrl} target="_blank" rel="noopener noreferrer">{t.hifzLink}</a>}
          <p className="note">{t.hifzDemo}</p>
        </div>
      </section>

      <section className="about-sec" aria-labelledby="ben-h">
        <h2 id="ben-h">{t.benefitsH}</h2>
        <div className="bens">
          {t.benefits.map((b, i) => (
            <div key={i}>{benefitIcons[i]}<h3>{b.h}</h3><p>{b.p}</p></div>
          ))}
        </div>
      </section>

      <section className="about-sec" aria-labelledby="qnv-h">
        <div className="vision">
          <div>
            <h2 id="qnv-h" style={{ marginBottom: 12 }}>{t.visionH}</h2>
            <p>{t.visionP}</p>
          </div>
          <div className="pillars" aria-hidden="true">
            {t.visionPillars.map((p, i) => (
              <div key={p} className={i > 0 ? 'on' : ''}>{p}</div>
            ))}
            <div className="pillars-base" />
          </div>
        </div>
      </section>
    </div>
  );
}
