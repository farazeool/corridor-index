import history from "../../data/history.json";
import { share } from "@/lib/format";

type Row = (typeof history)[number];
const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }) + ", " + new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });

function Spark({ title, rows, get, kill, max, color }: { title: string; rows: Row[]; get: (r: Row) => number; kill: number; max: number; color: string }) {
  const W = 520, H = 170, L = 40, R = 6, Tp = 14, B = 26;
  const x = (i: number) => (rows.length === 1 ? (L + W - R) / 2 : L + (i * (W - L - R)) / (rows.length - 1));
  const y = (v: number) => Tp + (1 - v / max) * (H - Tp - B);
  const pts = rows.map((r, i) => `${x(i).toFixed(1)},${y(get(r)).toFixed(1)}`).join(" ");
  const last = rows[rows.length - 1];
  return (
    <figure className="card p-5">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold">{title}</span>
        <span className="num text-2xl" style={{ color }}>{share(get(last), 1)}</span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full h-auto history" role="img" aria-label={`${title} on each data run`}>
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={L} x2={W - R} y1={y(max * f)} y2={y(max * f)} stroke="var(--rule)" />
            <text x={L - 8} y={y(max * f) + 4} textAnchor="end" className="fill-[var(--muted)] text-[11px] num">{share(max * f)}</text>
          </g>
        ))}
        <line x1={L} x2={W - R} y1={y(kill)} y2={y(kill)} stroke="var(--loses)" strokeDasharray="5 5" />
        <text x={W - R} y={y(kill) - 6} textAnchor="end" className="fill-[var(--loses)] text-[11px]">kill line {share(kill)}</text>
        <polyline points={pts} fill="none" stroke={color} strokeWidth={2.5} className="draw" pathLength={1} />
        {rows.map((r, i) => (
          <g key={r.at}>
            <circle cx={x(i)} cy={y(get(r))} r={4.5} fill="var(--paper)" stroke={color} strokeWidth={2}><title>{`${fmt(r.at)} UTC: ${share(get(r), 1)}`}</title></circle>
            <text x={x(i)} y={H - 6} textAnchor={rows.length > 1 && i === 0 ? "start" : rows.length > 1 && i === rows.length - 1 ? "end" : "middle"} className="fill-[var(--muted)] text-[10px]">{fmt(r.at)}</text>
          </g>
        ))}
      </svg>
    </figure>
  );
}

export function History() {
  const rows = history as Row[];
  return (
    <div>
      <div className="grid gap-5 md:grid-cols-2">
        <Spark title="Share of tested money where NEAR wins" rows={rows} get={(r) => r.winShare} kill={0.25} max={1} color="var(--wins)" />
        <Spark title="Protocol revenue at 10% adoption, vs new NEAR supply" rows={rows} get={(r) => r.revenueShare} kill={0.05} max={0.1} color="var(--blue)" />
      </div>
      <p className="mt-3 text-xs text-muted">
        One point per data run ({rows.length} so far, times in UTC). A GitHub Action re-runs every source daily and adds a point; the full log is in{" "}
        <a className="link" href="/data/history.json">history.json</a>.
      </p>
    </div>
  );
}
