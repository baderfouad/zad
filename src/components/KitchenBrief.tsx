import { useState } from 'react';
import { Rich } from './Rich';
import { briefGroups, type VenueView } from '../forecast';
import { fill, fmtDate } from '../i18n/format';
import { useApp } from '../state/AppState';

const TOP = 3;

/** The owner's short brief for the kitchen: one sentence, one card per meal, a message to copy or send. */
export function KitchenBrief({ v }: { v: VenueView }) {
  const { t, n, lang } = useApp();
  const [msg, setMsg] = useState<string | null>(null);
  const [showText, setShowText] = useState(false);
  const groups = briefGroups(v.plan, v.venue.kind);
  const name = (p: VenueView['plan'][number]) => (lang === 'ar' ? p.dish.nameAr : p.dish.nameEn);
  const diffText = (usual: number, kg: number) => {
    const d = usual - kg;
    if (Math.abs(d) < 0.5) return t.briefSame;
    return fill(d > 0 ? t.briefLess : t.briefMore, { d: n(Math.abs(d)) });
  };
  const date = fmtDate(lang, v.tomorrow, { weekday: 'long', day: 'numeric', month: 'long' });
  const vname = lang === 'ar' ? v.venue.nameAr : v.venue.nameEn;
  const sep = lang === 'ar' ? '، ' : ', ';

  const message = [
    fill(t.briefMsgTitle, { d: date }),
    vname,
    fill(t.briefMsgGuests, { n: n(v.guests) }) + (v.occ.id !== 'none' ? ` · ${t.occ[v.occ.id] ?? v.occ.id}` : ''),
    fill(t.briefMsgTotal, { kg: n(v.totalKg), diff: diffText(v.usualKg, v.totalKg) }),
    '',
    ...groups.flatMap((g) => [
      `${t.service[g.key]}: ${n(g.kg)} ${t.kg}`,
      ...g.dishes.map((d) => `• ${name(d.plan)}: ${n(d.kg, 1)} ${t.kg}`),
      '',
    ]),
    t.briefMsgFoot,
  ].join('\n');

  const copy = async () => {
    try { await navigator.clipboard.writeText(message); setMsg(t.briefCopied); }
    catch { setMsg(t.briefCopyFail); setShowText(true); }
  };

  return (
    <div className="brief">
      <p className="brief-line">
        <Rich s={t.briefLine} v={{ kg: n(v.totalKg), n: n(v.guests) }} />{' '}
        <span className={v.usualKg - v.totalKg >= 0.5 ? 'pill good' : v.totalKg - v.usualKg >= 0.5 ? 'pill bad' : 'pill'}>{diffText(v.usualKg, v.totalKg)}</span>
      </p>

      <ul className="meals">
        {groups.map((g) => (
          <li key={g.key} className="meal">
            <div className="meal-head">
              <h3>{t.service[g.key]}</h3>
              <p className="meal-kg num">{n(g.kg)}<small>{t.kg}</small></p>
            </div>
            <p className={'meal-diff' + (g.usualKg - g.kg >= 0.5 ? ' good' : g.kg - g.usualKg >= 0.5 ? ' bad' : '')}>{diffText(g.usualKg, g.kg)}</p>
            <p className="meal-dishes">
              <span className="sr">{t.briefMain}: </span>
              {g.dishes.slice(0, TOP).map((d, i) => (
                <span key={d.plan.dish.id}>{i > 0 && sep}{name(d.plan)} <b className="num">{n(d.kg)}</b></span>
              ))}
              {g.dishes.length > TOP && <span className="more">{sep}{fill(t.briefMoreDishes, { n: n(g.dishes.length - TOP) })}</span>}
            </p>
          </li>
        ))}
      </ul>

      <div className="brief-actions">
        <button type="button" className="btn palm" onClick={copy}>{t.briefCopy}</button>
        <a className="btn ghost" href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">{t.briefWa}</a>
      </div>
      <p className="note" aria-live="polite">{msg}</p>

      <details open={showText} onToggle={(e) => setShowText((e.target as HTMLDetailsElement).open)}>
        <summary>{t.briefText}</summary>
        <pre className="brief-text">{message}</pre>
      </details>
      <details>
        <summary>{fill(t.briefAll, { n: n(v.plan.length) })}</summary>
        <ul className="tell">
          {[...v.plan].sort((a, b) => b.fcKg - a.fcKg).map((p) => (
            <li key={p.dish.id}>
              <span className="d">{name(p)}</span>
              <span className="q num">{n(p.fcKg, 1)} <small>{t.kg}</small></span>
              <span className="was">{t.service[p.dish.service]} · {diffText(p.usualKg, p.fcKg)}</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
