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
export const Coin = () => <svg viewBox="0 0 24 24" {...P} strokeWidth={1.8}><circle cx="12" cy="12" r="9" /><path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .8-3 2s1.3 1.7 3 2 3 .8 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6v2M12 16v2" /></svg>;
export const Bin = () => <svg viewBox="0 0 24 24" {...P} strokeWidth={1.8}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" /></svg>;
export const Leaf = () => <svg viewBox="0 0 24 24" {...P} strokeWidth={1.8}><path d="M5 19c8 0 14-6 14-14-8 0-14 6-14 14zM5 19l7-7" /></svg>;
export const Screen = () => <svg viewBox="0 0 24 24" {...P} strokeWidth={1.8}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M7 13h4M7 16h7" /></svg>;
export const Sun = () => <svg viewBox="0 0 24 24" {...P} width="20" height="20"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>;
export const Moon = () => <svg viewBox="0 0 24 24" {...P} width="20" height="20"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></svg>;
export const Hand = () => <svg viewBox="0 0 24 24" {...P} strokeWidth={1.8}><path d="M3 14h4l3 2h5a2 2 0 0 0 0-4h-3M7 14v6M3 20h4l9-1 5-4a1.8 1.8 0 0 0-2.5-2.5L15 15" /><path d="M14 4.5a2.5 2.5 0 0 1 4 2.9L16 10l-2-2.6A2.5 2.5 0 0 1 14 4.5z" /></svg>;
export const Eye = () => <svg viewBox="0 0 24 24" {...P} strokeWidth={1.8}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>;
export const Truck = () => <svg viewBox="0 0 24 24" {...P} strokeWidth={1.8}><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7M7 19a2 2 0 1 0 0-.1M17 19a2 2 0 1 0 0-.1" /></svg>;
