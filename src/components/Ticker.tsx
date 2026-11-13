import type { Corridor } from "@/lib/data";
import { pct, usd } from "@/lib/format";

const LABEL: Record<string, string> = { wins: "NEAR wins", close: "too close", loses: "NEAR loses", illegal: "crypto illegal" };
const COLOR: Record<string, string> = { wins: "var(--wins)", close: "var(--close)", loses: "var(--loses)", illegal: "var(--law)" };

/** A slow, endless strip of real corridors and their verdicts. */
export function Ticker({ corridors, names }: { corridors: Corridor[]; names: Record<string, string> }) {
  const items = corridors
    .filter((c) => LABEL[c.verdict] && c.volume)
    .sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0))
    .slice(0, 28);
  const row = (k: string) => items.map((c) => (
    <span key={k + c.id} className="flex items-center gap-3 whitespace-nowrap text-sm">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: COLOR[c.verdict] }} />
      <span className="text-ink">{names[c.from]} → {names[c.to]}</span>
      <span style={{ color: COLOR[c.verdict] }}>{LABEL[c.verdict]}</span>
      <span className="num text-muted">
        {c.verdict === "wins" && c.keepPer200 != null ? `+${usd(c.keepPer200)} per $200` : `today ${pct(c.benchmark)}`}
      </span>
    </span>
  ));
  return (
    <div className="relative overflow-hidden border-y border-rule py-4 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]" aria-label="Largest corridors and their verdicts">
      <div className="marquee">{row("a")}{row("b")}</div>
    </div>
  );
}
