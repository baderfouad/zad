import { useState } from 'react';
import { Donut, LineChart, WasteChart } from '../components/charts';
import { DonateButton } from '../components/Donate';
import { DemoFlag } from '../components/Layout';
import { Week } from '../components/Week';
import { HifzNearest } from '../components/HifzNearest';
import { leftoverTotals } from '../data/derive';
import { FEATURES, type VenueView } from '../forecast';
import { digits, fill, fmtDate, parseDigits, weekdayName } from '../i18n/format';
import { useApp } from '../state/AppState';
import { useVenueView } from '../state/useVenueView';

export function Kitchen() {
  const { t, lang, data, scenario, setScenario } = useApp();
  const v = useVenueView();
  if (!v || !data) return <div className="wrap state">{t.noData}</div>;
  const vname = lang === 'ar' ? v.venue.nameAr : v.venue.nameEn;

  return (
    <div className="wrap kitchen">
      <div className="k-head">
        <div>
          <h1>{fill(t.kTitle, { v: vname })}</h1>
          <p className="for">{fill(t.kFor, { d: fmtDate(lang, v.tomorrow, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) })}</p>
          <DemoFlag />
        </div>
        <form className="scen" onSubmit={(e) => e.preventDefault()}>
          <NumField label={t.kGuests} value={v.guests} onChange={(x) => setScenario({ guests: x === null ? null : Math.max(0, Math.min(5000, Math.round(x))) })} />
          <label className="fld">
            <span>{t.kOcc}</span>
            <select value={v.occ.id} onChange={(e) => setScenario({ occasion: e.target.value })}>
              {data.occasions.map((o) => <option key={o.id} value={o.id}>{t.occ[o.id] ?? o.id}</option>)}
            </select>
          </label>
          <NumField label={t.kTemp} value={v.temp} className="temp" onChange={(x) => setScenario({ tempC: x })} />
          {(scenario.guests !== null || scenario.tempC !== null) && (
            <button type="button" className="linkbtn" onClick={() => setScenario({ guests: null, tempC: null })}>{t.kReset}</button>
          )}
        </form>
      </div>

      <div className="bi">
        <Kpis v={v} />
        <section className="tl span2" aria-labelledby="wk-h">
          <h2 id="wk-h">{t.weekH}</h2>
          <p className="sub">{t.weekTileS}</p>
          <Week days={v.week} />
        </section>
        <DishTile v={v} />
        <FunnelTile v={v} />
        <SourcesTile v={v} />
        <WasteTile v={v} />
        <AccuracyTile v={v} />
        <LeftTile />
        <WhyPanel v={v} />
        <MlPanel v={v} />
        <PrepSheet v={v} />
        <LeftoverLog v={v} />
        <section className="tl span4" aria-labelledby="near-h">
          <h2 id="near-h">{t.nearH}</h2>
          <p className="sub">{t.nearS}</p>
          <HifzNearest compact />
        </section>
      </div>
    </div>
  );
}

/** Text input that shows Arabic-Indic digits in Arabic and accepts either digit set. Empty means "use Zad's value". */
function NumField({ label, value, onChange, className = '' }: { label: string; value: number | null; onChange: (x: number | null) => void; className?: string }) {
  const { lang } = useApp();
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (value === null ? '' : digits(lang, String(value)));
  return (
    <label className={'fld ' + className}>
      <span>{label}</span>
      <input type="text" inputMode="decimal" autoComplete="off" value={shown}
        onChange={(e) => {
          setDraft(e.target.value);
          const x = parseDigits(e.target.value);
          if (e.target.value.trim() === '') onChange(null);
          else if (Number.isFinite(x)) onChange(x);
        }}
        onBlur={() => setDraft(null)} />
    </label>
  );
}

function Kpis({ v }: { v: VenueView }) {
  const { t, n, pct, signed } = useApp();
  const d = v.totalKg - v.usualKg;
  return (
    <>
      <section className="tl" aria-labelledby="k1">
        <h2 id="k1">{t.kpiGuests}</h2>
        <p className="sub">{fill(t.kpiGuestsS, { a: n(v.week[0].lo), b: n(v.week[0].hi) })}</p>
        <p className="big2 now num">{n(v.guests)}<small>{t.guests}</small></p>
      </section>
      <section className="tl" aria-labelledby="k2">
        <h2 id="k2">{t.kpiPrep}</h2>
        <p className="sub">{fill(t.kpiPrepS, { d: `${signed(d)} ${t.kg}`, u: n(v.usualKg) })}</p>
        <p className="big2 bad num">{n(v.totalKg)}<small>{t.kg}</small></p>
      </section>
      <section className="tl" aria-labelledby="k3">
        <h2 id="k3">{t.kpiWaste}</h2>
        <p className="sub">{fill(t.kpiWasteS, { p: pct(v.savings.rateBefore) })}</p>
        <p className="big2 good num">{pct(v.rate7)}</p>
      </section>
      <section className="tl" aria-labelledby="k4">
        <h2 id="k4">{t.kpiSaved}</h2>
        <p className="sub">{fill(t.kpiSavedS, { n: n(v.savings.daysWithZad) })}</p>
        <p className="big2 good num">{n(v.savings.savedQar)}<small>{t.qar}</small></p>
      </section>
    </>
  );
}

function DishTile({ v }: { v: VenueView }) {
  const { t, n, lang } = useApp();
  const services = [...new Set(v.plan.map((p) => p.dish.service))];
  const [svc, setSvc] = useState<string>('all');
  const rows = v.plan.filter((p) => svc === 'all' || p.dish.service === svc).sort((a, b) => b.fcKg - a.fcKg);
  const max = Math.max(...v.plan.map((p) => Math.max(p.usualKg, p.fcKg)), 1);
  return (
    <section className="tl span2 row2" aria-labelledby="dish-h">
      <h2 id="dish-h">{t.dishH}</h2>
      <p className="sub">{t.dishS}</p>
      <div className="legend">
        <span><i style={{ background: 'var(--palm)' }} />{t.lgZad}</span>
        <span><i style={{ background: 'var(--line)' }} />{t.lgUsual}</span>
      </div>
      {services.length > 1 && (
        <div className="seg" role="group" aria-label={t.cDish}>
          {['all', ...services].map((s) => (
            <button key={s} type="button" aria-pressed={svc === s} onClick={() => setSvc(s)}>{s === 'all' ? t.all : t.service[s]}</button>
          ))}
        </div>
      )}
      <div className="hb">
        {rows.map((p) => (
          <div className="r" key={p.dish.id}>
            <div className="nm">{lang === 'ar' ? p.dish.nameAr : p.dish.nameEn}<small>{t.station[p.dish.station]}</small></div>
            <div className="bars">
              <div className="b z" style={{ width: `${(p.fcKg / max) * 100}%` }} />
              <div className="b u" style={{ width: `${(p.usualKg / max) * 100}%` }} />
              <div className="lab"><span><b className="num">{n(p.fcKg, 1)} {t.kg}</b></span><span className="num">{t.lgUsual} {n(p.usualKg, 1)} {t.kg}</span></div>
            </div>
          </div>
        ))}
      </div>
      <p className="plan-note">{v.venue.kind === 'buffet' ? t.planBuffet : t.planAlacarte}</p>
    </section>
  );
}

function FunnelTile({ v }: { v: VenueView }) {
  const { t, n, pct } = useApp();
  const f = v.funnel;
  const w = (x: number) => `${Math.max((x / f.cooked) * 100, 3)}%`;
  const row = (label: string, x: number, cls: string, of = f.cooked) => (
    <div className="row">
      <div className="fl"><span>{label}</span><b className="num">{n(x)} {t.kg} · {pct(x / of)}</b></div>
      <div className={'f ' + cls} style={{ width: w(x) }} />
    </div>
  );
  return (
    <section className="tl" aria-labelledby="fun-h">
      <h2 id="fun-h">{t.funnelH}</h2>
      <p className="sub">{t.last14}</p>
      <div className="fun">
        {row(t.fCooked, f.cooked, 'cook')}
        {row(t.fEaten, f.eaten, 'eat')}
        {row(t.fLeft, f.leftover, 'left')}
        <div className="split">
          <div>{row(t.fDonated, f.donated, 'don', f.leftover)}</div>
          <div>{row(t.fThrown, f.thrown, 'thr', f.leftover)}</div>
        </div>
      </div>
    </section>
  );
}

function SourcesTile({ v }: { v: VenueView }) {
  const { t, n, pct } = useApp();
  const colors = ['var(--madder)', 'var(--saffron)', 'var(--indigo)'];
  const name = (k: string) => (k === 'overproduction' ? t.src[`overproduction_${v.venue.kind}`] : t.src[k]);
  const total = v.sources.reduce((a, s) => a + s.kg, 0);
  return (
    <section className="tl" aria-labelledby="src-h">
      <h2 id="src-h">{t.sourcesH}</h2>
      <p className="sub">{t.last14} · {n(total)} {t.kg}</p>
      <div className="donut">
        <Donut parts={v.sources.map((s, i) => ({ value: s.kg, color: colors[i] }))} label={v.sources.map((s) => `${name(s.key)} ${pct(s.share)}`).join('، ')} />
        <ul>
          {v.sources.map((s, i) => (
            <li key={s.key}><i style={{ background: colors[i] }} /><span>{name(s.key)} {pct(s.share)}</span><small className="num">{n(s.kg)} {t.kg}</small></li>
          ))}
        </ul>
      </div>
      <p className="foot">{t.srcNote}</p>
    </section>
  );
}

function WasteTile({ v }: { v: VenueView }) {
  const { t, n } = useApp();
  return (
    <section className="tl span2" aria-labelledby="waste-h">
      <h2 id="waste-h">{t.wasteH}</h2>
      <p className="sub">{t.wasteS}</p>
      <div className="legend">
        <span><i style={{ background: 'var(--madder)' }} />{t.before} · {n(v.savings.avgWasteBeforeKg)} {t.kg}</span>
        <span><i style={{ background: 'var(--palm)' }} />{t.after} · {n(v.savings.avgWasteWithKg)} {t.kg}</span>
      </div>
      <WasteChart
        days={v.last28.map((d) => ({ date: d.date, value: d.wastedKg, before: d.period === 'Before Zad' }))}
        label={fill(t.wasteChartLabel, { a: n(v.savings.avgWasteBeforeKg), b: n(v.savings.avgWasteWithKg) })}
        zadLabel={t.zadOn}
      />
    </section>
  );
}

function AccuracyTile({ v }: { v: VenueView }) {
  const { t, pct } = useApp();
  const days = v.accuracy.days;
  return (
    <section className="tl" aria-labelledby="acc-h">
      <h2 id="acc-h">{t.accH}</h2>
      <p className="sub">{t.accS}</p>
      <p className="big2 good num">{pct(v.accuracy.accuracy)}</p>
      {days.length > 1 && (
        <>
          <div className="legend">
            <span><i style={{ background: 'var(--ink)' }} />{t.actual}</span>
            <span><i className="dash" style={{ borderColor: 'var(--palm)' }} />{t.forecast}</span>
          </div>
          <LineChart height={120} dates={days.map((d) => d.date)} label={t.accChartLabel} series={[
            { name: 'a', values: days.map((d) => d.guestsActual), color: 'var(--ink)' },
            { name: 'f', values: days.map((d) => d.guestsForecast), color: 'var(--palm)', dash: true },
          ]} />
        </>
      )}
    </section>
  );
}

function LeftTile() {
  const { t, n, log } = useApp();
  const { safe, total } = leftoverTotals(log);
  return (
    <section className="tl" aria-labelledby="left-h">
      <h2 id="left-h">{t.leftTileH}</h2>
      <p className="sub">{t.leftTileS}</p>
      <p className="big2 good num">{n(safe, 1)}<small>{t.kg}</small></p>
      <p className="foot">{t.logTotal}: {n(total, 1)} {t.kg}</p>
      <DonateButton compact />
    </section>
  );
}

function WhyPanel({ v }: { v: VenueView }) {
  const { t, n, signed, lang, scenario } = useApp();
  const s = v.steps;
  const steps = [
    { k: 'weekday', label: fill(t.why.weekday, { d: weekdayName(lang, v.tomorrow) }), d: s.weekday },
    { k: 'occasion', label: `${t.why.occasion} · ${t.occ[v.occ.id] ?? v.occ.id}`, d: s.occasion },
    { k: 'weather', label: `${t.why.weather} · ${v.temp === null ? '—' : n(v.temp) + t.celsius}`, d: s.weather },
    { k: 'trend', label: `${t.why.trend} ×${n(v.venue.trend, 2)}`, d: s.trend },
  ];
  // running totals for the waterfall
  let run = s.typical;
  const segs = steps.map((st) => { const from = run; run += st.d; return { ...st, from, to: run }; });
  const vals = [s.typical, ...segs.map((x) => x.to)];
  const lo = Math.floor(Math.min(...vals) * 0.85 / 10) * 10, hi = Math.ceil(Math.max(...vals) * 1.03 / 10) * 10;
  const pos = (x: number) => ((x - lo) / (hi - lo)) * 100;
  const bar = (a: number, b: number, cls: string) => (
    <div className="track"><div className={'wseg ' + cls} style={{ insetInlineStart: `${pos(Math.min(a, b))}%`, width: `${Math.max(pos(Math.max(a, b)) - pos(Math.min(a, b)), 0.8)}%` }} /></div>
  );
  return (
    <section className="tl span2" aria-labelledby="why-h">
      <h2 id="why-h">{t.whyH}</h2>
      <p className="sub">{t.whyS}</p>
      <div className="wf">
        <div className="r"><span className="lbl">{t.why.typical}</span>{bar(lo, s.typical, 'base')}<span className="val num">{n(s.typical)}</span></div>
        {segs.map((x) => (
          <div className="r" key={x.k}>
            <span className="lbl">{x.label}</span>
            {bar(x.from, x.to, x.d >= 0 ? 'up' : 'down')}
            <span className="val num">{signed(x.d)}</span>
          </div>
        ))}
        <div className="r total"><span className="lbl">{t.why.total}</span>{bar(lo, s.expected, 'tot')}<span className="val num">{n(s.expected)}</span></div>
      </div>
      <p className="foot">{fill(t.whyNote, { n: n(s.daysUsed), m: n(s.sameWeekdayDays), t: '×' + n(v.venue.trend, 2) })} · {t.guests}</p>
      {scenario.guests !== null && <p className="own">{fill(t.whyOwn, { n: n(v.guests), e: n(s.expected) })}</p>}
    </section>
  );
}

function MlPanel({ v }: { v: VenueView }) {
  const { t, n, pct, signed, lang } = useApp();
  const bt = v.test, m = v.model;
  if (!bt || !m) {
    return (
      <section className="tl span2" aria-labelledby="ml-h"><h2 id="ml-h">{t.mlH}</h2><p>{t.mlTooLittle}</p></section>
    );
  }
  const accM = 1 - bt.modelMape, accB = 1 - bt.baselineMape;
  const winner = Math.abs(accM - accB) < 0.005 ? 'tie' : accM > accB ? 'model' : 'simple';
  const nf = FEATURES.length - 1;
  const ref = ['2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14']; // Mon…Sat, only for day names
  const c = m.coef;
  return (
    <section className="tl span2" aria-labelledby="ml-h">
      <h2 id="ml-h">{t.mlH}</h2>
      <p className="sub">{fill(t.mlS, { n: n(bt.testRows) })}</p>
      <div className="ml">
        <div className={'m' + (winner === 'simple' ? ' win' : '')}>
          <h3>{t.mlSimple}</h3>
          <p className="d">{t.mlSimpleP}</p>
          <p className="acc num">{pct(accB, 1)}<small>{t.mlAcc}</small></p>
          <p className="tm">{t.mlTomorrow}: <b className="num">{n(v.steps.expected)} {t.guests}</b></p>
        </div>
        <div className={'m' + (winner === 'model' ? ' win' : '')}>
          <h3>{t.mlModel}</h3>
          <p className="d">{fill(t.mlModelP, { f: n(nf) })}</p>
          <p className="acc num">{pct(accM, 1)}<small>{t.mlAcc}</small></p>
          <p className="tm">{t.mlTomorrow}: <b className="num">{n(v.modelTomorrow ?? 0)} {t.guests}</b></p>
        </div>
      </div>
      <p className="ml-verdict">
        {winner === 'model' ? t.mlWinModel : winner === 'simple' ? fill(t.mlWinSimple, { n: n(bt.trainRows), f: n(nf) }) : t.mlTie}
      </p>
      <div className="legend">
        <span><i style={{ background: 'var(--ink)' }} />{t.actual}</span>
        <span><i style={{ background: 'var(--saffron)' }} />{t.mlSimple}</span>
        <span><i style={{ background: 'var(--indigo)' }} />{t.mlModel}</span>
      </div>
      <LineChart height={140} dates={bt.dates} label={t.mlChart} series={[
        { name: 'a', values: bt.actual, color: 'var(--ink)', dots: true },
        { name: 'b', values: bt.baseline, color: 'var(--saffron)', dash: true, dots: true },
        { name: 'm', values: bt.model, color: 'var(--indigo)', dash: true, dots: true },
      ]} />
      <details>
        <summary style={{ cursor: 'pointer', fontWeight: 700, minHeight: 44, display: 'flex', alignItems: 'center' }}>{t.mlFeatures}</summary>
        <table className="coef">
          <tbody>
            {ref.map((d, i) => (
              <tr key={d}><td>{t.mlFeat.weekday}: {weekdayName(lang, d)}</td><td className="n num">{signed(c[i + 1], 1)} {t.guests}</td></tr>
            ))}
            <tr><td>{t.mlFeat.days}</td><td className="n num">{signed(c[7], 2)} {t.guests}</td></tr>
            <tr><td>{t.mlFeat.occ}</td><td className="n">{Math.abs(c[8]) < 1e-6 ? t.mlNoOcc : `${signed(c[8], 1)} ${t.guests}`}</td></tr>
            <tr><td>{t.mlFeat.lag}</td><td className="n num">×{n(c[9], 2)}</td></tr>
          </tbody>
        </table>
        <p className="foot">{fill(t.mlRidge, { r: n(m.ridge, 3) })}</p>
      </details>
    </section>
  );
}

function PrepSheet({ v }: { v: VenueView }) {
  const { t, n, lang } = useApp();
  return (
    <section className="tl span4" aria-labelledby="prep-h">
      <h2 id="prep-h">{t.cPlan}</h2>
      <p className="sub">{v.venue.kind === 'buffet' ? t.planBuffet : t.planAlacarte}</p>
      <div className="log-wrap">
        <table className="log prep">
          <thead>
            <tr><th scope="col">{t.cDish}</th><th scope="col">{t.cStation}</th><th scope="col">{t.cFc} ({t.kg})</th><th scope="col">{t.lgRange} ({t.kg})</th><th scope="col">{t.cUsual} ({t.kg})</th><th scope="col">{t.cPlan} ({t.kg})</th></tr>
          </thead>
          <tbody>
            {v.plan.map((p) => (
              <tr key={p.dish.id}>
                <td className="nm">{lang === 'ar' ? p.dish.nameAr : p.dish.nameEn}<small>{t.service[p.dish.service]}</small></td>
                <td>{t.station[p.dish.station]}</td>
                <td className="num"><b>{n(p.fcKg, 1)}</b></td>
                <td className="num">{n(p.lo, 1)}–{n(p.hi, 1)}</td>
                <td className="num">{n(p.usualKg, 1)}</td>
                <td className="num" style={{ fontSize: '.82rem' }}>{p.batches.map((b) => `${t.batch[b.when]} ${n(b.kg, 1)}`).join(' · ')}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><td>{t.total}</td><td /><td className="num">{n(v.totalKg, 1)}</td><td /><td className="num">{n(v.usualKg, 1)}</td><td /></tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

function LeftoverLog({ v }: { v: VenueView }) {
  const { t, n, lang, log, logDate, setLogEntry, resetLog } = useApp();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const tot = leftoverTotals(log);
  const dish = (id: string) => v.dishes.find((d) => d.id === id)!;
  return (
    <section className="tl span4" id="log" aria-labelledby="log-h">
      <h2 id="log-h">{t.logH}</h2>
      <p className="sub">{t.logS}</p>
      <div className="log-wrap">
        <table className="log">
          <thead><tr><th scope="col">{t.cDish}</th><th scope="col">{t.cLeft}</th><th scope="col">{t.cSafe}</th></tr></thead>
          <tbody>
            {log.map((e) => {
              const d = dish(e.dishId);
              if (!d) return null;
              const nm = lang === 'ar' ? d.nameAr : d.nameEn;
              return (
                <tr key={e.dishId}>
                  <td className="nm">{nm}<small>{t.station[d.station]}</small></td>
                  <td>
                    <input type="text" inputMode="decimal" autoComplete="off" aria-label={fill(t.leftOf, { d: nm })}
                      value={draft[e.dishId] ?? n(e.leftKg, 1)}
                      onChange={(ev) => {
                        const s = ev.target.value;
                        setDraft((x) => ({ ...x, [e.dishId]: s }));
                        const k = parseDigits(s);
                        if (Number.isFinite(k) && k >= 0) setLogEntry(e.dishId, { leftKg: k });
                        else if (s.trim() === '') setLogEntry(e.dishId, { leftKg: 0 });
                      }}
                      onBlur={() => setDraft((x) => { const c = { ...x }; delete c[e.dishId]; return c; })} />
                  </td>
                  <td className="safe-cell">
                    <label><span className="sr">{fill(t.safeOf, { d: nm })}</span>
                      <input type="checkbox" checked={e.heldSafely} onChange={(ev) => setLogEntry(e.dishId, { heldSafely: ev.target.checked })} />
                    </label>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr><td>{t.logTotal}</td><td className="num">{n(tot.total, 1)} {t.kg}</td><td className="num good">{t.logSafe}: {n(tot.safe, 1)} {t.kg}</td></tr>
          </tfoot>
        </table>
      </div>
      <div className="log-foot">
        <span>{t.rule}</span>
        <span>{logDate && fill(t.logDate, { d: fmtDate(lang, logDate, { day: 'numeric', month: 'long' }) })} <button type="button" className="linkbtn" onClick={() => { resetLog(); setDraft({}); }}>{t.logReset}</button></span>
      </div>
    </section>
  );
}
