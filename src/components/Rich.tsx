import { Fragment } from 'react';
import { fill } from '../i18n/format';

/** Renders a translated string, turning <b>…</b> (optionally with class="…") into bold elements. Nothing else is parsed. */
export function Rich({ s, v = {} }: { s: string; v?: Record<string, string | number> }) {
  const text = fill(s, v);
  const parts = text.split(/(<b(?: class="[\w-]+")?>.*?<\/b>)/g);
  return (
    <>
      {parts.map((p, i) => {
        const m = /^<b(?: class="([\w-]+)")?>(.*?)<\/b>$/.exec(p);
        return m ? <b key={i} className={m[1]}>{m[2]}</b> : <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}
