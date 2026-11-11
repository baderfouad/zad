import { useRef } from 'react';
import { leftoverTotals } from '../data/derive';
import { setting } from '../data';
import { fill, fmtTime } from '../i18n/format';
import { useApp } from '../state/AppState';

/**
 * Hifz Al Naama pickup request. A DEMO: it never sends anything, and says so.
 * The amount is the "held safely" total from the kitchen's leftover log.
 */
export function DonateButton({ compact = false }: { compact?: boolean }) {
  const { t, n, lang, log, donation, donate, undoDonation, data, venueId } = useApp();
  const btn = useRef<HTMLButtonElement>(null);
  const { safe } = leftoverTotals(log);
  const pickup = fmtTime(lang, (data && setting(data, 'pickup_by', venueId)) || '22:30');
  return (
    <>
      <button ref={btn} type="button" className="btn palm" disabled={safe <= 0 || donation !== null} onClick={() => donate(safe)}>
        {compact ? t.sendShort : t.send}
      </button>
      <div aria-live="polite">
        {donation && (
          <div className="sentnote">
            <span>{fill(t.sent, { kg: n(donation.kg, 1), t: pickup })}</span>
            <button type="button" className="linkbtn" onClick={() => { undoDonation(); requestAnimationFrame(() => btn.current?.focus()); }}>{t.undo}</button>
          </div>
        )}
      </div>
    </>
  );
}
