import { DemoFlag } from '../components/Layout';
import { DonateButton } from '../components/Donate';
import { Plate } from '../components/Plate';
import { Rich } from '../components/Rich';
import { Week } from '../components/Week';
import { Upcoming } from '../components/Upcoming';
import { KitchenBrief } from '../components/KitchenBrief';
import { HifzNearest } from '../components/HifzNearest';
import { leftoverTotals } from '../data/derive';
import { fill, fmtDate, weekdayName } from '../i18n/format';
import { useApp } from '../state/AppState';
import { href } from '../state/useRoute';
import { useVenueView } from '../state/useVenueView';
import { setKitchenTab } from '../state/kitchenTab';

export function Owner() {
  const { t, n, pct, signedPct, lang, data, setScenario, log } = useApp();
  const v = useVenueView();
  if (!v || !data) return <div className="wrap state">{t.noData}</div>;

  const diff = v.usualKg - v.totalKg;
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
          <p className="when plan-bar">
            <span>{fill(v.isTomorrow ? t.oWhen : t.planFor, { d: fmtDate(lang, v.target, { weekday: 'long', day: 'numeric', month: 'long' }) })}</span>
            {!v.isTomorrow && <button type="button" className="linkbtn" onClick={() => setScenario({ target: null, occasion: null, guests: null })}>{t.backTomorrow}</button>}
          </p>
          <h1>{t.oCook}</h1>
          <p className="big num">{n(v.totalKg)}<small>{t.kgLong}</small></p>
          <p className="for"><Rich s={t.oGuestsLine} v={{ n: n(v.guests) }} />{v.occ.id !== 'none' && <> · {t.occ[v.occ.id] ?? v.occ.id}</>}</p>
          <p className="why">
            {diff >= 0.5 ? <Rich s={t.oLess} v={{ kg: n(diff), qar: n(v.saveQar) }} /> : <Rich s={t.oMore} v={{ kg: n(-diff) }} />}
          </p>
        </section>

        <section className="o-block" aria-labelledby="tell-h">
          <h2 id="tell-h">{t.oTellH}</h2>
          <KitchenBrief v={v} />
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
            <p><Rich s={t.oCompare} v={{ a: pct(s.rateBefore), b: pct(s.rateWith) }} /></p>
          </section>
        )}

        <section className="o-block left-box" aria-labelledby="left-h">
          <h2 id="left-h">{t.oLeftH}</h2>
          <p>{left.safe > 0 ? <Rich s={t.oLeftP} v={{ kg: n(left.safe, 1), m: n(left.meals) }} /> : t.oLeftNone}</p>
          <DonateButton />
          <a className="note" href={href('kitchen') + '#log'} onClick={(e) => { e.preventDefault(); setKitchenTab('plan'); location.hash = '#kitchen'; setTimeout(() => document.getElementById('log')?.scrollIntoView(), 50); }}>{t.oLeftEdit}</a>
        </section>

        <section className="o-block more" aria-labelledby="more-h">
          <h2 id="more-h">{t.moreH}</h2>
          <details>
            <summary>{t.srcH}</summary>
            <div className="fold">
              <p className="hint">{t.srcS}</p>
              <ol className="src-steps">
                <li><Rich s={t.srcHistory} v={{ n: n(v.steps.sameWeekdayDays), d: weekdayName(lang, v.target), g: n(v.steps.typical + v.steps.weekday) }} /></li>
                {v.isWeekend && <li>{fill(t.srcWeekend, { d: weekdayName(lang, v.target) })}</li>}
                <li className={v.calEvent ? 'ev' : ''}>
                  {v.calEvent
                    ? <Rich s={t.srcEvent} v={{ e: lang === 'ar' ? v.calEvent.nameAr : v.calEvent.nameEn, p: signedPct((v.occ.guestMultiplier - 1) * 100) }} />
                    : t.calNoEvent}
                </li>
                {v.steps.weatherFactor !== 1 && v.temp !== null && (
                  <li>{fill(t.srcWeather, { t: n(v.temp), p: signedPct((v.steps.weatherFactor - 1) * 100, 1) })}</li>
                )}
                {v.venue.trend !== 1 && <li>{fill(t.srcTrend, { p: signedPct((v.venue.trend - 1) * 100) })}</li>}
                <li className="res"><Rich s={t.srcResult} v={{ n: n(v.guests) }} /></li>
              </ol>
              <a className="note" href={href('kitchen')} onClick={() => setKitchenTab('forecast')}>{t.srcMore}</a>
            </div>
          </details>
          <details>
            <summary>{t.calH}</summary>
            <div className="fold">
              <p className="hint">{t.calS}</p>
              <Upcoming v={v} />
            </div>
          </details>
          <details>
            <summary>{t.weekH}</summary>
            <div className="fold">
              <p className="hint">{t.weekS}</p>
              <Week days={v.week} />
            </div>
          </details>
          {s.daysWithZad > 0 && (
            <details>
              <summary>{t.platesH}</summary>
              <div className="fold">
                <p className="hint">{t.platesS}</p>
                <div className="plates" dir="ltr">
                  {last7.map((d) => (
                    <figure key={d.date}>
                      <Plate share={d.wastePct} label={fill(t.plateLabel, { d: weekdayName(lang, d.date), p: pct(d.wastePct) })} />
                      <figcaption dir="auto">{weekdayName(lang, d.date, 'short')}<br /><b className="num">{pct(d.wastePct)}</b></figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            </details>
          )}
          <details>
            <summary>{t.nearH}</summary>
            <div className="fold">
              <p className="hint">{t.nearS}</p>
              <HifzNearest />
            </div>
          </details>
        </section>
      </div>
    </div>
  );
}
