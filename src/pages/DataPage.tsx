import { useRef, useState } from 'react';
import { clearOverrides, detectFile, FILES, parseCsv, saveOverride, type FileName } from '../data';
import { fill } from '../i18n/format';
import { useApp } from '../state/AppState';

const MAX_ROWS = 250;

export function DataPage() {
  const { t, n, data, reload } = useApp();
  const [tab, setTab] = useState<FileName>('history');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  if (!data) return null;

  const raw = data.raw[tab];
  const badRows = new Set(data.warnings.filter((w) => w.file === tab && w.row > 1).map((w) => w.row));
  const fname = (f: FileName) => t.file[f] ?? f;

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const text = await file.text();
    const which = detectFile(parseCsv(text).headers);
    if (!which) { setMsg({ ok: false, text: t.uploadBad }); return; }
    saveOverride(which, text);
    await reload({ [which]: text });
    setTab(which);
    setMsg({ ok: true, text: fill(t.uploadOk, { f: `${which}.csv` }) });
  }

  function onKey(e: React.KeyboardEvent, i: number) {
    const dirSign = document.documentElement.dir === 'rtl' ? -1 : 1;
    let j = i;
    if (e.key === 'ArrowRight') j = i + dirSign;
    else if (e.key === 'ArrowLeft') j = i - dirSign;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = FILES.length - 1;
    else return;
    e.preventDefault();
    const f = FILES[(j + FILES.length) % FILES.length];
    setTab(f);
    tabRefs.current[f]?.focus();
  }

  const download = () => {
    const text = [raw.headers.join(','), ...raw.rows.map((r) => raw.headers.map((h) => {
      const v = r[h] ?? ''; const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' }));
    a.download = `${tab}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <div className="wrap data-page">
      <h1>{t.dataH}</h1>
      <p>{t.dataP}</p>

      <section className={'warns' + (data.warnings.length ? '' : ' ok')} aria-labelledby="warn-h">
        <h2 id="warn-h">{t.warnH}</h2>
        {data.warnings.length === 0 ? <p>{t.warnNone}</p> : (
          <ul>
            {data.warnings.map((w, i) => (
              <li key={i} dir="auto">{w.row > 1 ? fill(t.warnRow, { f: `${w.file}.csv`, r: n(w.row), m: w.message }) : fill(t.warnFile, { f: `${w.file}.csv`, m: w.message })}</li>
            ))}
          </ul>
        )}
      </section>

      <div className="up-row">
        <input id="up" type="file" accept=".csv,text/csv" onChange={onFile} />
        <label htmlFor="up" className="btn palm">{t.uploadBtn}</label>
        {data.overridden.length > 0 && (
          <button type="button" className="linkbtn" onClick={async () => { clearOverrides(); await reload(); setMsg(null); }}>{t.resetUploads}</button>
        )}
        <span className="note">{t.uploadHelp}</span>
      </div>
      <p role="status" className={'msg ' + (msg?.ok ? 'good' : 'bad')}>{msg?.text}</p>

      <div className="tabs" role="tablist" aria-label={t.dataH}>
        {FILES.map((f, i) => (
          <button key={f} ref={(el) => { tabRefs.current[f] = el; }} type="button" role="tab" id={`tab-${f}`} aria-controls="tabpanel"
            aria-selected={tab === f} tabIndex={tab === f ? 0 : -1} onClick={() => setTab(f)} onKeyDown={(e) => onKey(e, i)}>
            {fname(f)}
            {data.overridden.includes(f) && <span className="badge">{t.uploaded}</span>}
          </button>
        ))}
      </div>

      <div id="tabpanel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        <div className="up-row" style={{ marginBottom: 10 }}>
          <b dir="ltr">{tab}.csv</b>
          <span className="note">{fill(t.rows, { n: n(raw.rows.length) })}{raw.rows.length > MAX_ROWS && ` · ${fill(t.showing, { n: n(MAX_ROWS) })}`}</span>
          <button type="button" className="linkbtn" onClick={download}>{fill(t.download, { f: tab })}</button>
        </div>
        <div className="tbl-wrap" tabIndex={0} role="region" aria-label={fill(t.tableCaption, { f: tab })}>
          <table className="raw" dir="ltr">
            <caption className="sr">{fill(t.tableCaption, { f: tab })}</caption>
            <thead><tr><th scope="col">#</th>{raw.headers.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
            <tbody>
              {raw.rows.slice(0, MAX_ROWS).map((r, i) => (
                <tr key={i} className={badRows.has(i + 2) ? 'bad' : ''}>
                  <td className="n">{i + 2}</td>
                  {raw.headers.map((h) => {
                    const v = r[h];
                    return <td key={h} className={typeof v === 'number' ? 'n' : ''} dir="auto">{v === null || v === undefined ? '' : String(v)}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
