import { DemoFlag } from '../components/Layout';
import { DonateButton } from '../components/Donate';
import { Plate } from '../components/Plate';
import { Rich } from '../components/Rich';
import { Week } from '../components/Week';
import { leftoverTotals } from '../data/derive';
import type { DishPlan } from '../forecast';
import { digits, fill, fmtDate, parseDigits, weekdayName } from '../i18n/format';
import { useApp } from '../state/AppState';
import { href } from '../state/useRoute';
import { useVenueView } from '../state/useVenueView';

const SERVICE_ORDER = ['Breakfast', 'Lunch', 'Dinner', 'All day'];

export function Owner() {
  const { t, n, pct, lang, data, scenario, setScenario, log } = useApp();
  const v = useVenueView();
  if (!v || !data) return <div className="wrap state">{t.noData}</div>;

  const diff = v.usualKg - v.totalKg;
  const own = scenario.guests !== null;
  const setGuests = (g: number) => setScenario({ guests: Math.max(0, Math.min(5000, Math.round(g))) });
  const occs = data.occasions.map((o) => o.id);
  const name = (p: DishPlan) => (lang === 'ar' ? p.dish.nameAr : p.dish.nameEn);
  const dishes = [...v.plan].sort((a, b) => SERVICE_ORDER.indexOf(a.dish.service) - SERVICE_ORDER.indexOf(b.dish.service) || b.fcKg - a.fcKg);
  const left = leftoverTotals(log);
  const s = v.savings;
  const last7 = v.history.slice(-7);

  return (
    <div className="wrap">
      <div className="owner">
        <div className="o-head">
          <span className="hello">{lang === 'ar' ? v.venue.nameAr : v.venue.nameEn}</span>
          <DemoFlag />
        </div>

        <section className="o-answer" aria-live="polite" aria-atomic="true">
          <p className="when">{fill(t.oWhen, { d: fmtDate(lang, v.tomorrow, { weekday: 'long', day: 'numeric', month: 'long' }) })}</p>
          <h1>{t.oCook}</h1>
          <p className="big num">{n(v.totalKg)}<small>{t.kgLong}</small></p>
          <p className="for"><Rich s={t.oGuestsLine} v={{ n: n(v.guests) }} />{v.occ.id !== 'none' && <> · {t.occ[v.occ.id] ?? v.occ.id}</>}</p>
          <p className="why">
            {diff >= 0.5 ? <Rich s={t.oLess} v={{ kg: n(diff), qar: n(v.saveQar) }} /> : <Rich s={t.oMore} v={{ kg: n(-diff) }} />}
          </p>
        </section>

        <section className="o-block" aria-labelledby="g-h">
          <h2 id="g-h">{t.oGH}</h2>
          <p className="hint">{fill(own ? t.oGHintOwn : t.oGHint, { n: n(v.steps.expected) })}</p>
          <div className="stepper">
            <button type="button" className="round" aria-label={t.oMinus} onClick={() => setGuests(v.guests - 10)}>−</button>
            <label>
              <span className="sr">{t.oGuestsInput}</span>
              <input type="text" inputMode="numeric" autoComplete="off" value={digits(lang, String(v.guests))}
                onChange={(e) => { const x = parseDigits(e.target.value); if (Number.isFinite(x)) setGuests(x); else if (e.target.value === '') setGuests(0); }} />
            </label>
            <button type="button" className="round" aria-label={t.oPlus} onClick={() => setGuests(v.guests + 10)}>+</button>
            {own && <button type="button" className="linkbtn" onClick={() => setScenario({ guests: null })}>{t.oReset}</button>}
          </div>
          <h2 style={{ marginTop: 18 }} id="occ-h">{t.oOccH}</h2>
          <div className="chips" role="group" aria-labelledby="occ-h">
            {occs.map((o) => (
              <button key={o} type="button" className="chip" aria-pressed={v.occ.id === o} onClick={() => setScenario({ occasion: o })}>
                {t.occ[o] ?? o}
              </button>
            ))}
          </div>
        </section>

        <section className="o-block" aria-labelledby="w-h">
          <h2 id="w-h">{t.weekH}</h2>
          <p className="hint">{t.weekS}</p>
          <Week days={v.week} />
        </section>

        <section className="o-block" aria-labelledby="tell-h">
          <h2 id="tell-h">{t.oTellH}</h2>
          <ul className="tell">
            {dishes.map((p) => {
              const d = p.usualKg - p.fcKg;
              return (
                <li key={p.dish.id}>
                  <span className="d">{name(p)}</span>
                  <span className="q num">{n(p.fcKg, 1)} <small>{t.kg}</small></span>
                  <span className="was">
                    {t.service[p.dish.service]} ·{' '}
                    {Math.abs(d) < 0.5 ? t.oWasSame
                      : <Rich s={d > 0 ? t.oWasDown : t.oWasUp} v={{ kg: n(p.usualKg, 1), d: `${n(Math.abs(d), 1)} ${t.kg}` }} />}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        {s.daysWithZad > 0 && s.daysBefore > 0 && (
          <section className="o-block" aria-labelledby="since-h">
            <h2 id="since-h">{fill(t.oSinceH, { n: n(s.daysWithZad) })}</h2>
            <div className="tiles">
              <div className="tile">
                <div className="l">{t.tMoney}</div>
                <div className="v num">{n(s.savedQar)}<small>{t.qar}</small></div>
              </div>
              <div className="tile">
                <div className="l">{t.tFood}</div>
                <div className="v num">{n(s.savedKg)}<small>{t.kg}</small></div>
                <div className="s">{fill(t.tFoodS, { n: n(s.savedMeals) })}</div>
              </div>
            </div>
            <p style={{ marginTop: 8 }}><Rich s={t.oCompare} v={{ a: pct(s.rateBefore), b: pct(s.rateWith) }} /></p>
            <h3 style={{ marginTop: 10, fontSize: '1.05rem' }}>{t.platesH}</h3>
            <p className="hint">{t.platesS}</p>
            <div className="plates" dir="ltr">
              {last7.map((d) => (
                <figure key={d.date}>
                  <Plate share={d.wastePct} label={fill(t.plateLabel, { d: weekdayName(lang, d.date), p: pct(d.wastePct) })} />
                  <figcaption dir="auto">{weekdayName(lang, d.date, 'short')}<br /><b className="num">{pct(d.wastePct)}</b></figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        <section className="o-block left-box" aria-labelledby="left-h">
          <h2 id="left-h">{t.oLeftH}</h2>
          <p>{left.safe > 0 ? <Rich s={t.oLeftP} v={{ kg: n(left.safe, 1), m: n(left.meals) }} /> : t.oLeftNone}</p>
          <DonateButton />
          <a className="note" href={href('kitchen') + '#log'} onClick={(e) => { e.preventDefault(); location.hash = '#/kitchen'; setTimeout(() => document.getElementById('log')?.scrollIntoView(), 50); }}>{t.oLeftEdit}</a>
        </section>
      </div>
    </div>
  );
}
