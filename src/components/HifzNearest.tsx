import { useState } from 'react';
import { byDistance } from '../data/derive';
import type { HifzLocation } from '../data/types';
import { digits, fill } from '../i18n/format';
import { useApp } from '../state/AppState';

/** Simplified outline of Qatar (lon, lat). Schematic only: good enough to place pins, not for navigation. */
const QATAR: [number, number][] = [
  [50.8, 24.74], [50.83, 24.95], [50.86, 25.1], [50.8, 25.3], [50.76, 25.45], [50.8, 25.55], [50.86, 25.65], [50.93, 25.8],
  [51.03, 25.96], [51.12, 26.08], [51.22, 26.15], [51.3, 26.12], [51.38, 26.05], [51.47, 25.97], [51.55, 25.92], [51.58, 25.82],
  [51.52, 25.73], [51.5, 25.65], [51.5, 25.55], [51.53, 25.45], [51.535, 25.38], [51.525, 25.33], [51.535, 25.3], [51.56, 25.28],
  [51.61, 25.27], [51.62, 25.22], [51.61, 25.17], [51.62, 25.1], [51.6, 25.02], [51.57, 24.96], [51.5, 24.85], [51.42, 24.72],
  [51.35, 24.62], [51.25, 24.58], [51.1, 24.5], [50.95, 24.55], [50.85, 24.65],
];
const COS = Math.cos((25.3 * Math.PI) / 180); // shrink longitude so distances look right at Qatar's latitude

interface Box { w: number; h: number; lon0: number; lon1: number; lat0: number; lat1: number }
const proj = (b: Box) => (lon: number, lat: number): [number, number] => [
  ((lon - b.lon0) / (b.lon1 - b.lon0)) * b.w,
  ((b.lat1 - lat) / (b.lat1 - b.lat0)) * b.h,
];
const outline = (b: Box) => { const p = proj(b); return QATAR.map(([x, y]) => p(x, y).map((v) => v.toFixed(1)).join(',')).join(' '); };

/** A box around all points, padded, at least ~12 km across, with the panel's aspect ratio. */
function fitBox(points: { lat: number; lon: number }[], w: number, h: number): Box {
  let lon0 = Math.min(...points.map((p) => p.lon)), lon1 = Math.max(...points.map((p) => p.lon));
  let lat0 = Math.min(...points.map((p) => p.lat)), lat1 = Math.max(...points.map((p) => p.lat));
  const cx = (lon0 + lon1) / 2, cy = (lat0 + lat1) / 2;
  let spanY = Math.max((lat1 - lat0) * 1.35, 0.12), spanX = Math.max((lon1 - lon0) * 1.35, 0.12 / COS);
  if (spanX * COS / spanY > w / h) spanY = (spanX * COS * h) / w; else spanX = (spanY * w) / h / COS;
  lon0 = cx - spanX / 2; lon1 = cx + spanX / 2; lat0 = cy - spanY / 2; lat1 = cy + spanY / 2;
  return { w, h, lon0, lon1, lat0, lat1 };
}

/** "44355555" → "4435 5555". In Arabic the digits are Arabic-Indic and kept left-to-right (marks stop the groups swapping). */
const phoneText = (lang: 'ar' | 'en', p: string) => {
  const parts = p.length === 8 ? [p.slice(0, 4), p.slice(4)] : [p];
  return lang === 'ar' ? '\u2066' + parts.map((x) => digits(lang, x)).join('\u200E \u200E') + '\u2069' : parts.join(' ');
};
const mapsUrl = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
const dirUrl = (from: { lat: number; lon: number }, q: string) =>
  `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lon}&destination=${encodeURIComponent(q)}`;

export function HifzNearest({ compact = false }: { compact?: boolean }) {
  const { t, n, lang, data, venueId } = useApp();
  const [me, setMe] = useState<{ lat: number; lon: number } | null>(null);
  const [locMsg, setLocMsg] = useState<string | null>(null);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
  if (!data) return null;
  const venue = data.venues.find((v) => v.id === venueId);
  const places = data.hifz;
  const vname = venue ? (lang === 'ar' ? venue.nameAr : venue.nameEn) : '';
  const nm = (p: HifzLocation) => (lang === 'ar' ? p.nameAr : p.nameEn);
  const area = (p: HifzLocation) => (lang === 'ar' ? p.areaAr : p.areaEn);

  if (!places.length) return <p className="note">{t.nearNone}</p>;
  const venuePt = venue && venue.lat !== null && venue.lon !== null ? { lat: venue.lat, lon: venue.lon } : null;
  const from = me ?? venuePt;
  if (!from) return <p className="note">{t.nearNoVenue}</p>;

  const ranked = byDistance(from, places);
  const best = ranked.find((r) => r.place.kind === 'pickup') ?? ranked[0];
  const phoneShown = phoneText(lang, best.place.phone);
  const km = n(best.km, 1);

  const locate = () => {
    if (!navigator.geolocation) { setLocMsg(t.nearMeFail); return; }
    setLocMsg(t.nearMeBusy);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setMe({ lat: pos.coords.latitude, lon: pos.coords.longitude }); setLocMsg(null); },
      () => setLocMsg(t.nearMeFail),
      { timeout: 8000, maximumAge: 600000 },
    );
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(best.place.phone); setCopyMsg(fill(t.nearCopied, { p: phoneShown })); }
    catch { setCopyMsg(fill(t.nearCopyFail, { p: phoneShown })); }
  };

  // map panels
  const W = 300, H = 300;
  const pts = [from, ...(venuePt && me ? [venuePt] : []), ...places];
  const box = fitBox(pts, W, H);
  const p = proj(box);
  const OW = 70, OH = 120;
  const ov: Box = { w: OW, h: OH, lon0: 50.7, lon1: 51.7, lat0: 24.4, lat1: 26.25 };
  const po = proj(ov);
  const [bx0, by0] = po(box.lon0, box.lat1), [bx1, by1] = po(box.lon1, box.lat0);
  const listed = [best, ...ranked.filter((r) => r !== best)];
  const order = new Map(listed.map((r, i) => [r.place.id, i + 1]));

  return (
    <div className={'near' + (compact ? ' compact' : '')}>
      <div className="near-map" dir="ltr">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={fill(t.nearMapLabel, { v: me ? t.nearYouLabel : vname, n: nm(best.place), km })}>
          <rect width={W} height={H} className="sea" />
          <clipPath id="near-clip"><rect width={W} height={H} /></clipPath>
          <polygon points={outline(box)} className="land" clipPath="url(#near-clip)" />
          {ranked.map((r) => (
            <line key={r.place.id} x1={p(from.lon, from.lat)[0]} y1={p(from.lon, from.lat)[1]} x2={p(r.place.lon, r.place.lat)[0]} y2={p(r.place.lon, r.place.lat)[1]}
              className={r === best ? 'route best' : 'route'} />
          ))}
          {venuePt && (() => { const [x, y] = p(venuePt.lon, venuePt.lat); return (
            <g><rect x={x - 7} y={y - 7} width={14} height={14} transform={`rotate(45 ${x} ${y})`} className="pin-venue" />
              <text x={x} y={y + 22} textAnchor={x > W * 0.62 ? 'end' : x < W * 0.38 ? 'start' : 'middle'} className="pin-label" direction={lang === "ar" ? "rtl" : "ltr"}>{vname}</text></g>
          ); })()}
          {me && (() => { const [x, y] = p(me.lon, me.lat); return (
            <g><circle cx={x} cy={y} r={7} className="pin-me" /><text x={x} y={y - 12} textAnchor="middle" className="pin-label" direction={lang === "ar" ? "rtl" : "ltr"}>{t.nearYouLabel}</text></g>
          ); })()}
          {[...ranked].reverse().map((r) => { const [x, y] = p(r.place.lon, r.place.lat); const isBest = r === best; return (
            <g key={r.place.id}>
              {isBest && <circle cx={x} cy={y} r={15} className="pin-ring" />}
              <circle cx={x} cy={y} r={isBest ? 11 : 9} className={isBest ? 'pin-hifz best' : 'pin-hifz'} />
              <text x={x} y={y + 4} textAnchor="middle" className="pin-num">{n(order.get(r.place.id)!)}</text>
            </g>
          ); })}
          <g transform={`translate(${W - OW - 8} 8)`} aria-hidden="true">
            <rect width={OW} height={OH} className="ov-bg" />
            <polygon points={outline(ov)} className="land" />
            <rect x={bx0} y={by0} width={Math.max(bx1 - bx0, 3)} height={Math.max(by1 - by0, 3)} className="ov-box" />
            <text x={OW / 2} y={OH - 6} textAnchor="middle" className="pin-label small">{t.nearQatar}</text>
          </g>
        </svg>
      </div>

      <div className="near-info">
        <p className="near-k">{me ? t.nearToYou : fill(t.nearTo, { v: vname })}</p>
        <h3>{nm(best.place)}</h3>
        <p className="near-area">{area(best.place)} · {fill(t.nearKm, { km })}</p>
        <p className="near-phone num" dir="ltr">{phoneShown}</p>
        <div className="near-actions">
          <a className="btn palm" href={`tel:+974${best.place.phone}`}>{fill(t.nearCall, { p: phoneShown })}</a>
          <button type="button" className="btn ghost" onClick={copy}>{t.nearCopy}</button>
          <a className="btn ghost" href={mapsUrl(best.place.mapsQuery)} target="_blank" rel="noopener noreferrer">{t.nearMaps}</a>
          {venuePt && !me && <a className="linkbtn" href={dirUrl(venuePt, best.place.mapsQuery)} target="_blank" rel="noopener noreferrer">{t.nearDir}</a>}
        </div>
        <p aria-live="polite" className="note">{copyMsg}</p>

        {ranked.length > 1 && (
          <>
            <h4>{t.nearAll}</h4>
            <ol className="near-list">
              {listed.map((r, i) => (
                <li key={r.place.id}>
                  <span className="pin-dot num" aria-hidden="true">{n(i + 1)}</span>
                  <span><b>{nm(r.place)}</b><br /><small>{area(r.place)} · {n(r.km, 1)} {t.km} · {phoneText(lang, r.place.phone)}
                    {r.place.source && <> · <a href={r.place.source} target="_blank" rel="noopener noreferrer">{t.nearSource}</a></>}</small></span>
                </li>
              ))}
            </ol>
          </>
        )}
        <div className="near-actions">
          {me
            ? <button type="button" className="linkbtn" onClick={() => { setMe(null); setLocMsg(null); }}>{t.nearVenue}</button>
            : <button type="button" className="linkbtn" onClick={locate}>{t.nearMe}</button>}
          <span aria-live="polite" className="note">{locMsg}</span>
        </div>
        <p className="note">{t.nearNote}</p>
      </div>
    </div>
  );
}
