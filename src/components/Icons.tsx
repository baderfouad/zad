/** Hand-drawn line icons. All decorative (aria-hidden); buttons carry their own text. */
const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };

export const Logo = () => (
  <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
    <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="2.4" />
    <path d="M16 2 A14 14 0 0 1 29.3 20.3 L16 16Z" fill="var(--madder)" />
    <circle cx="16" cy="16" r="7" fill="none" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);
export const House = () => <svg viewBox="0 0 48 48" {...P} strokeWidth={2.4}><path d="M8 40V20l16-12 16 12v20M18 40V28h12v12" /></svg>;
export const Pot = () => <svg viewBox="0 0 48 48" {...P} strokeWidth={2.4}><path d="M10 22h28v14a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4zM6 22h36M18 16c0-3 2-3 2-6M26 16c0-3 2-3 2-6" /></svg>;
export const Sun = () => <svg viewBox="0 0 24 24" {...P} width="20" height="20"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>;
export const Moon = () => <svg viewBox="0 0 24 24" {...P} width="20" height="20"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></svg>;
