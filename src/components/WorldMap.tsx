"use client";

import { useMemo, useState } from "react";
import world from "@/lib/world.json";
import { usdB, share, VERDICT_LABEL } from "@/lib/format";

export type MapCorridor = { id: string; other: string; verdict: string; volume: number };
export type MapStat = { name: string; volume: number; wins: number; close: number; loses: number; illegal: number; untested: number; corridors: MapCorridor[] };
type Dir = "to" | "from";

const COLORS: Record<string, string> = { wins: "var(--wins)", close: "var(--close)", loses: "var(--loses)", illegal: "var(--law)", untested: "var(--incumbent)" };

/** One colour per country: where most of its tested money lands, or why it couldn't be tested. */
function tone(s?: MapStat) {
  if (!s) return { key: "none", fill: "var(--map-land)", opacity: 1 };
  const tested = s.wins + s.close + s.loses;
  if (!tested) return s.illegal >= s.untested ? { key: "illegal", fill: COLORS.illegal, opacity: 0.75 } : { key: "untested", fill: COLORS.untested, opacity: 0.7 };
  const w = s.wins / tested;
  const key = w >= 0.6 ? "wins" : w <= 0.25 ? "loses" : "close";
  return { key, fill: COLORS[key], opacity: 0.45 + 0.5 * Math.min(1, Math.log10(1 + s.volume / 1e9) / 1.6) };
}

export function WorldMap({ to, from }: { to: Record<string, MapStat>; from: Record<string, MapStat> }) {
  const [dir, setDir] = useState<Dir>("to");
  const [hover, setHover] = useState<{ iso: string; x: number; y: number } | null>(null);
  const [picked, setPicked] = useState<string>("IND");
  const data = dir === "to" ? to : from;
  const tones = useMemo(() => Object.fromEntries(Object.entries(data).map(([k, v]) => [k, tone(v)])), [data]);
  const sel = data[picked] ?? null;
  const hov = hover ? data[hover.iso] : null;
  const tested = (s: MapStat) => s.wins + s.close + s.loses;

  const enter = (iso: string | null) => (e: React.MouseEvent<SVGElement>) => {
    if (!iso) return setHover(null);
    const r = (e.currentTarget.ownerSVGElement ?? (e.currentTarget as unknown as SVGSVGElement)).getBoundingClientRect();
    setHover({ iso, x: e.clientX - r.left, y: e.clientY - r.top });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      <div className="card relative p-3 sm:p-5 overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 px-1 pb-3">
          <div className="flex gap-1.5" role="group" aria-label="Direction">
            <button className="btn !py-1 !text-xs" aria-pressed={dir === "to"} onClick={() => setDir("to")}>Money arriving</button>
            <button className="btn !py-1 !text-xs" aria-pressed={dir === "from"} onClick={() => setDir("from")}>Money sent from</button>
          </div>
          <div className="ml-auto flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
            {(["wins", "close", "loses", "illegal", "untested"] as const).map((k) => (
              <span key={k} className="inline-flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: COLORS[k] }} />{k === "wins" ? "Mostly NEAR wins" : k === "loses" ? "Mostly NEAR loses" : k === "close" ? "Mixed" : VERDICT_LABEL[k]}</span>
            ))}
          </div>
        </div>
        <svg viewBox={`0 0 ${world.width} ${world.height}`} className="worldmap w-full h-auto" onMouseLeave={() => setHover(null)} role="img" aria-label="World map coloured by where NEAR is cheaper for sending money home">
          {world.countries.map((c, i) => {
            const t = c.iso3 ? tones[c.iso3] : undefined;
            const has = !!t;
            return (
              <path
                key={i}
                d={c.d}
                className={`country ${has ? "has" : ""} ${picked === c.iso3 ? "picked" : ""}`}
                style={{ fill: t ? t.fill : "var(--map-land)", fillOpacity: t ? t.opacity : 1, animationDelay: `${Math.round((c.cx / world.width) * 700)}ms` }}
                onMouseMove={has ? enter(c.iso3) : enter(null)}
                onClick={has ? () => setPicked(c.iso3!) : undefined}
              >
                <title>{c.name}</title>
              </path>
            );
          })}
          {world.dots.map((d) => {
            const t = tones[d.iso3];
            return t ? (
              <circle key={d.iso3} cx={d.cx} cy={d.cy} r={4} className={`country has ${picked === d.iso3 ? "picked" : ""}`} style={{ fill: t.fill, fillOpacity: Math.max(0.8, t.opacity) }} onMouseMove={enter(d.iso3)} onClick={() => setPicked(d.iso3)} />
            ) : null;
          })}
        </svg>
        {hover && hov && (
          <div className="pointer-events-none absolute z-10 rounded-xl border border-rule-strong bg-[var(--card-solid)] px-3 py-2 text-xs shadow-xl" style={{ left: Math.min(hover.x + 14, 9999), top: hover.y + 14 }}>
            <p className="font-semibold text-sm text-ink">{hov.name}</p>
            <p className="text-muted">{usdB(hov.volume)} a year {dir === "to" ? "arriving" : "sent"}</p>
            {tested(hov) > 0 ? (
              <p className="mt-1"><span className="text-wins num">{share(hov.wins / tested(hov))}</span> of tested money cheaper through NEAR</p>
            ) : (
              <p className="mt-1 text-muted">{hov.illegal >= hov.untested ? "Crypto illegal at one end" : "No public P2P market to test"}</p>
            )}
          </div>
        )}
      </div>

      <aside className="card p-5 self-start" aria-live="polite">
        {sel ? (
          <>
            <p className="eyebrow">{dir === "to" ? "Sending money to" : "Sending money from"}</p>
            <p className="mt-1 font-display text-3xl font-bold">{sel.name}</p>
            <p className="mt-1 text-sm text-ink-soft">{usdB(sel.volume)} a year across {sel.corridors.length} priced corridors</p>
            {tested(sel) > 0 && (
              <div className="mt-4">
                <div className="flex h-2.5 overflow-hidden rounded-full bg-paper-deep">
                  {(["wins", "close", "loses"] as const).map((k) => <span key={k} style={{ width: `${(sel[k] / tested(sel)) * 100}%`, background: COLORS[k] }} />)}
                </div>
                <p className="mt-2 text-sm"><span className="num text-wins">{share(sel.wins / tested(sel))}</span> of the tested money is cheaper through NEAR.</p>
              </div>
            )}
            <ul className="mt-4 divide-y divide-rule text-sm">
              {sel.corridors.slice(0, 7).map((c) => (
                <li key={c.id}>
                  <a href={`/c/${c.id}`} className="flex items-center justify-between gap-3 py-2 hover:text-blue">
                    <span className="truncate">{dir === "to" ? `from ${c.other}` : `to ${c.other}`}</span>
                    <span className="flex items-center gap-2 shrink-0"><span className="num text-muted text-xs">{usdB(c.volume)}</span><i className="h-2 w-2 rounded-full" style={{ background: COLORS[c.verdict] }} title={VERDICT_LABEL[c.verdict]} /></span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted">Click any coloured country. Each row opens that corridor.</p>
          </>
        ) : (
          <p className="text-sm text-muted">Click any coloured country to see its corridors.</p>
        )}
      </aside>
    </div>
  );
}
