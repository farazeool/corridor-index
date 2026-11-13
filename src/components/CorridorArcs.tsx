import type { Corridor } from "@/lib/data";

// Approximate country centres (longitude, latitude), for drawing only.
const AT: Record<string, [number, number]> = {
  USA: [-98, 39], CAN: [-100, 56], MEX: [-102, 23], GTM: [-90, 15], SLV: [-89, 13.7], HND: [-87, 15], NIC: [-85, 13], DOM: [-70, 19], JAM: [-77, 18],
  COL: [-74, 4], ECU: [-78, -1.5], BRA: [-52, -10], PER: [-75, -9], GBR: [-2, 54], ESP: [-4, 40], FRA: [2, 46], DEU: [10, 51], ITA: [12, 42], POL: [19, 52],
  ROU: [25, 46], UKR: [31, 49], TUR: [35, 39], MAR: [-6, 32], DZA: [3, 28], EGY: [30, 27], JOR: [36, 31], SAU: [45, 24], KWT: [47.5, 29.3], QAT: [51, 25],
  ARE: [54, 24], OMN: [57, 21], BHR: [50.5, 26], YEM: [48, 15], PAK: [69, 30], IND: [78, 22], NPL: [84, 28], BGD: [90, 24], LKA: [81, 7.5], CHN: [104, 35],
  VNM: [106, 16], THA: [101, 15], MYS: [102, 4], SGP: [104, 1.3], IDN: [113, -2], PHL: [122, 12], KOR: [128, 36], JPN: [138, 36], AUS: [134, -25],
  NGA: [8, 9], GHA: [-1, 8], KEN: [38, 0], ETH: [39, 9], ZAF: [25, -29], ZWE: [30, -19], SEN: [-14, 14],
};
const W = 1200, H = 560;
const P = ([lon, lat]: [number, number]) => [((lon + 115) / 260) * W, ((62 - lat) / 100) * H] as const;
const COLOR: Record<string, string> = { wins: "var(--wins)", close: "var(--close)", loses: "var(--loses)", illegal: "var(--law)" };

export function CorridorArcs({ corridors }: { corridors: Corridor[] }) {
  const arcs = corridors
    .filter((c) => COLOR[c.verdict] && AT[c.from] && AT[c.to] && c.volume)
    .sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0))
    .slice(0, 22);
  const places = [...new Set(arcs.flatMap((c) => [c.from, c.to]))];
  const grid = [];
  for (let lon = -110; lon <= 140; lon += 10) for (let lat = 55; lat >= -35; lat -= 10) grid.push(P([lon, lat]));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet" aria-hidden>
      <defs>
        <radialGradient id="fade" cx="55%" cy="50%" r="62%">
          <stop offset="0%" stopColor="#fff" stopOpacity="1" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id="m"><rect width={W} height={H} fill="url(#fade)" /></mask>
      </defs>
      <g mask="url(#m)">
        {grid.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={1} fill="rgba(255,255,255,0.12)" />)}
        {arcs.map((c, i) => {
          const [x1, y1] = P(AT[c.from]); const [x2, y2] = P(AT[c.to]);
          const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - Math.min(160, Math.hypot(x2 - x1, y2 - y1) * 0.35);
          const d = `M${x1.toFixed(1)} ${y1.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
          const w = 0.8 + Math.sqrt((c.volume ?? 0) / 1e9) * 0.32;
          return (
            <g key={c.id}>
              <path d={d} pathLength={1} className="arc" fill="none" stroke={COLOR[c.verdict]} strokeOpacity={0.75} strokeWidth={w}
                style={{ ["--len" as string]: 1, animationDelay: `${300 + i * 90}ms` } as React.CSSProperties} />
              <circle r={2.2} fill={COLOR[c.verdict]} style={{ offsetPath: `path("${d}")`, animation: `travel ${5 + (i % 5)}s linear ${2 + i * 0.4}s infinite`, opacity: 0 } as React.CSSProperties} />
            </g>
          );
        })}
        {places.map((p) => { const [x, y] = P(AT[p]); return <circle key={p} cx={x} cy={y} r={3} fill="var(--ink)" className="dot-pulse" />; })}
      </g>
    </svg>
  );
}
