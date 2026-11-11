import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { fmtDate } from '../i18n/format';
import { useApp } from '../state/AppState';

/** Measures the container so charts draw in real pixels (text stays readable at 375px). */
function useWidth(): [React.RefObject<HTMLDivElement>, number] {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(320);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const set = () => setW(Math.max(200, Math.floor(el.clientWidth)));
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

const niceMax = (v: number) => {
  const p = 10 ** Math.floor(Math.log10(Math.max(v, 1)));
  const m = [1, 2, 2.5, 5, 10].find((k) => k * p >= v)!;
  return m * p;
};

function Frame({ label, height, children }: { label: string; height: number; children: (w: number) => ReactNode }) {
  const [ref, w] = useWidth();
  return (
    <div className="chart" ref={ref} dir="ltr">
      <svg width={w} height={height} viewBox={`0 0 ${w} ${height}`} role="img" aria-label={label}>{children(w)}</svg>
    </div>
  );
}

function YAxis({ max, w, h, top, left, n, unit = '' }: { max: number; w: number; h: number; top: number; left: number; n: (x: number) => string; unit?: string }) {
  const ticks = [0, 0.5, 1].map((f) => f * max);
  return (
    <>
      {ticks.map((v) => {
        const y = top + h - (v / max) * h;
        return (
          <g key={v}>
            <line className="gl" x1={left} x2={w} y1={y} y2={y} />
            <text className="ax" x={left - 6} y={y + 4} textAnchor="end">{n(v)}{unit}</text>
          </g>
        );
      })}
    </>
  );
}

export interface DayBar { date: string; value: number; before: boolean }

/** Daily waste, red before Zad and green with Zad, with a marker where Zad starts. */
export function WasteChart({ days, label, zadLabel }: { days: DayBar[]; label: string; zadLabel: string }) {
  const { n, lang } = useApp();
  const H = 200, top = 22, bottom = 26, left = 34;
  const max = niceMax(Math.max(...days.map((d) => d.value)));
  const h = H - top - bottom;
  const startIdx = days.findIndex((d) => !d.before);
  return (
    <Frame label={label} height={H}>
      {(w) => {
        const bw = (w - left) / days.length;
        return (
          <>
            <YAxis max={max} w={w} h={h} top={top} left={left} n={(x) => n(x)} />
            {days.map((d, i) => {
              const bh = (d.value / max) * h;
              return <rect key={d.date} x={left + i * bw + bw * 0.15} width={bw * 0.7} y={top + h - bh} height={bh} rx={1.5} fill={d.before ? 'var(--madder)' : 'var(--palm)'} />;
            })}
            {startIdx > 0 && (
              <g>
                <line x1={left + startIdx * bw} x2={left + startIdx * bw} y1={top - 14} y2={top + h} stroke="var(--ink)" strokeDasharray="4 3" />
                <text className="ax" x={left + startIdx * bw + 4} y={top - 6} style={{ fill: 'var(--ink)', fontWeight: 700 }}>{zadLabel}</text>
              </g>
            )}
            {days.map((d, i) => (i % 7 === 0 ? (
              <text key={d.date} className="ax" x={left + i * bw + bw / 2} y={H - 8} textAnchor="start">{fmtDate(lang, d.date, { day: 'numeric', month: 'short' })}</text>
            ) : null))}
          </>
        );
      }}
    </Frame>
  );
}

export interface Series { name: string; values: (number | null)[]; color: string; dash?: boolean; dots?: boolean }

/** Small multi-line chart over dates (actual vs forecast). */
export function LineChart({ dates, series, label, height = 170 }: { dates: string[]; series: Series[]; label: string; height?: number }) {
  const { n, lang } = useApp();
  const top = 10, bottom = 24, left = 34, right = 8;
  const all = series.flatMap((s) => s.values.filter((v): v is number => v !== null));
  const lo0 = Math.min(...all), hi0 = Math.max(...all);
  const pad = Math.max((hi0 - lo0) * 0.15, 5);
  const lo = Math.max(0, Math.floor((lo0 - pad) / 10) * 10), hi = Math.ceil((hi0 + pad) / 10) * 10;
  const h = height - top - bottom;
  return (
    <Frame label={label} height={height}>
      {(w) => {
        const x = (i: number) => left + (dates.length === 1 ? 0 : (i / (dates.length - 1)) * (w - left - right));
        const y = (v: number) => top + h - ((v - lo) / (hi - lo)) * h;
        return (
          <>
            {[lo, (lo + hi) / 2, hi].map((v) => (
              <g key={v}>
                <line className="gl" x1={left} x2={w - right} y1={y(v)} y2={y(v)} />
                <text className="ax" x={left - 6} y={y(v) + 4} textAnchor="end">{n(v)}</text>
              </g>
            ))}
            {series.map((s) => {
              const pts = s.values.map((v, i) => (v === null ? null : `${x(i)},${y(v)}`)).filter(Boolean);
              return (
                <g key={s.name}>
                  <polyline points={pts.join(' ')} fill="none" stroke={s.color} strokeWidth={2.2} strokeDasharray={s.dash ? '5 4' : undefined} strokeLinejoin="round" />
                  {s.dots && s.values.map((v, i) => (v === null ? null : <circle key={i} cx={x(i)} cy={y(v)} r={3} fill={s.color} />))}
                </g>
              );
            })}
            {dates.map((d, i) => {
              const step = Math.ceil(dates.length / Math.max(2, Math.floor(w / 70)));
              const last = dates.length - 1;
              const show = (i % step === 0 && (i === last || last - i >= step * 0.6)) || i === last;
              return show ? (
                <text key={d} className="ax" x={x(i)} y={height - 6} textAnchor={i === 0 ? 'start' : i === dates.length - 1 ? 'end' : 'middle'}>{fmtDate(lang, d, { day: 'numeric', month: 'short' })}</text>
              ) : null;
            })}
          </>
        );
      }}
    </Frame>
  );
}

/** Donut for shares; slices drawn clockwise from the top. */
export function Donut({ parts, label, center }: { parts: { value: number; color: string }[]; label: string; center?: string }) {
  const total = parts.reduce((a, p) => a + p.value, 0) || 1;
  let acc = 0;
  const R = 46, r = 28, c = 55;
  const pt = (f: number, rad: number) => [c + rad * Math.sin(f * 2 * Math.PI), c - rad * Math.cos(f * 2 * Math.PI)];
  return (
    <svg viewBox="0 0 110 110" role="img" aria-label={label}>
      {parts.map((p, i) => {
        const a0 = acc / total; acc += p.value; const a1 = Math.min(acc / total, 0.9999);
        const [x0, y0] = pt(a0, R), [x1, y1] = pt(a1, R), [x2, y2] = pt(a1, r), [x3, y3] = pt(a0, r);
        const large = a1 - a0 > 0.5 ? 1 : 0;
        return <path key={i} d={`M${x0} ${y0}A${R} ${R} 0 ${large} 1 ${x1} ${y1}L${x2} ${y2}A${r} ${r} 0 ${large} 0 ${x3} ${y3}Z`} fill={p.color} stroke="var(--card)" strokeWidth="1.5" />;
      })}
      {center && <text x={c} y={c + 5} textAnchor="middle" style={{ font: '700 14px var(--f-body)', fill: 'var(--ink)' }}>{center}</text>}
    </svg>
  );
}
