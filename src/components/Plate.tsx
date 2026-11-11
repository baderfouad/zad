/** A plate whose red slice is the share of food thrown away. */
export function Plate({ share, label }: { share: number; label: string }) {
  const a = Math.min(Math.max(share, 0), 0.999) * 2 * Math.PI;
  const r = 26, cx = 32, cy = 32;
  const x = cx + r * Math.sin(a), y = cy - r * Math.cos(a);
  const large = a > Math.PI ? 1 : 0;
  return (
    <svg viewBox="0 0 64 64" role="img" aria-label={label}>
      <circle cx={cx} cy={cy} r={30} fill="var(--field)" stroke="var(--line)" strokeWidth="2" />
      <circle cx={cx} cy={cy} r={r} fill="var(--card)" stroke="var(--line)" strokeWidth="1" />
      {share > 0 && <path d={`M${cx} ${cy} L${cx} ${cy - r} A${r} ${r} 0 ${large} 1 ${x} ${y} Z`} fill="var(--madder)" />}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--line)" strokeWidth="1" />
    </svg>
  );
}
