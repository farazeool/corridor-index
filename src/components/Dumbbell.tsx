import type { Corridor } from "@/lib/data";

/** One row per corridor: grey dot = what families pay today, blue bar = NEAR route range. */
export function Dumbbell({ rows, names }: { rows: Corridor[]; names: Record<string, string> }) {
  const W = 1040, left = 268, right = 40, rowH = 30, top = 34;
  const max = Math.max(4, Math.ceil(Math.max(...rows.map((r) => Math.max(r.benchmark, r.nearHi ?? 0)))));
  const X = (p: number) => left + (Math.max(0, p) / max) * (W - left - right);
  const H = top + rows.length * rowH + 10;
  const ticks = Array.from({ length: max + 1 }, (_, i) => i).filter((t) => max <= 10 || t % 2 === 0);
  const verdictColor: Record<string, string> = { wins: "var(--wins)", close: "var(--close)", loses: "var(--loses)" };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Cost of sending $200: today vs through NEAR, largest tested corridors">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={X(t)} x2={X(t)} y1={top - 8} y2={H - 6} stroke="var(--rule)" />
          <text x={X(t)} y={top - 14} textAnchor="middle" fontSize="12" fill="var(--muted)" className="num">{t}%</text>
        </g>
      ))}
      {rows.map((r, i) => {
        const y = top + i * rowH + rowH / 2;
        return (
          <g key={r.id}>
            <text x={left - 14} y={y + 4} textAnchor="end" fontSize="13" fill="var(--ink)">{names[r.from]} → {names[r.to]}</text>
            <line x1={X(Math.min(r.benchmark, r.nearLo!))} x2={X(Math.max(r.benchmark, r.nearHi!))} y1={y} y2={y} stroke="var(--rule-strong)" strokeDasharray="2 3" />
            <rect x={X(r.nearLo!)} y={y - 5} width={Math.max(3, X(r.nearHi!) - X(r.nearLo!))} height={10} rx={5} fill="var(--blue)" opacity={0.85} />
            <circle cx={X(r.benchmark)} cy={y} r={6} fill="var(--incumbent)" stroke="var(--paper)" strokeWidth={2} />
            <circle cx={W - 12} cy={y} r={4} fill={verdictColor[r.verdict]} />
          </g>
        );
      })}
    </svg>
  );
}
