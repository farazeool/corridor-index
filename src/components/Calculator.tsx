"use client";

import { useEffect, useMemo, useState } from "react";
import type { Corridor } from "@/lib/data";
import { pct, usd } from "@/lib/format";
import { Pill } from "./Pill";

type Live = { ok: boolean; amountOut?: number; costPct?: number; seconds?: number; at?: string; route?: string; error?: string };

const PRESETS: [string, string, string][] = [
  ["KWT", "PAK", "Kuwait → Pakistan"],
  ["ARE", "IND", "UAE → India"],
  ["SAU", "IND", "Saudi Arabia → India"],
  ["USA", "MEX", "US → Mexico"],
  ["GBR", "IND", "UK → India"],
  ["KWT", "BGD", "Kuwait → Bangladesh"],
];

export function Calculator({
  corridors, names, legPct, legSeconds, buffer,
}: { corridors: Corridor[]; names: Record<string, string>; legPct: number; legSeconds: number; buffer: number }) {
  const [from, setFrom] = useState("KWT");
  const [to, setTo] = useState("PAK");
  const [live, setLive] = useState<Live | null>(null);

  useEffect(() => {
    let off = false;
    fetch("/api/quote").then((r) => r.json()).then((j) => !off && setLive(j)).catch(() => !off && setLive({ ok: false }));
    return () => { off = true; };
  }, []);

  const senders = useMemo(() => [...new Set(corridors.map((c) => c.from))].sort((a, b) => names[a].localeCompare(names[b])), [corridors, names]);
  const receivers = useMemo(
    () => corridors.filter((c) => c.from === from).map((c) => c.to).sort((a, b) => names[a].localeCompare(names[b])),
    [corridors, from, names],
  );
  const c = corridors.find((x) => x.from === from && x.to === to) ?? corridors.find((x) => x.from === from)!;

  const today = 200 * (1 - c.benchmark / 100);
  const tested = c.nearLo != null;
  const nearBest = tested ? 200 * (1 - c.nearLo! / 100) : null;
  const nearWorst = tested ? 200 * (1 - c.nearHi! / 100) : null;

  return (
    <div className="card p-5 sm:p-7">
      <div className="flex flex-wrap items-end gap-3">
        <label className="grow basis-40">
          <span className="eyebrow">Send $200 from</span>
          <select className="field mt-1" value={from} onChange={(e) => { setFrom(e.target.value); const first = corridors.find((x) => x.from === e.target.value); if (first) setTo(first.to); }}>
            {senders.map((s) => <option key={s} value={s}>{names[s]}</option>)}
          </select>
        </label>
        <label className="grow basis-40">
          <span className="eyebrow">to</span>
          <select className="field mt-1" value={c.to} onChange={(e) => setTo(e.target.value)}>
            {receivers.map((r) => <option key={r} value={r}>{names[r]}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {PRESETS.map(([f, t, label]) => (
          <button key={label} className="btn !py-1 !text-xs" aria-pressed={from === f && c.to === t} onClick={() => { setFrom(f); setTo(t); }}>
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-stretch">
        <div className="rounded-2xl border border-rule bg-[rgba(255,255,255,0.02)] p-5">
          <p className="text-sm font-semibold">{c.benchmarkKind === "online providers" ? "Online providers today" : "A typical provider today"}</p>
          <p className="num mt-2 text-3xl">{usd(today)}</p>
          <p className="mt-1 text-sm text-ink-soft">arrives · cost <span className="num">{pct(c.benchmark)}</span></p>
          <p className="mt-3 text-xs text-muted">
            World Bank, Q3 2025, {c.providers} providers checked. Cheapest: <span className="num">{pct(c.min)}</span>.
          </p>
        </div>
        <div className="rounded-2xl border border-blue/60 bg-blue-wash p-5 shadow-[0_0_60px_-20px_var(--blue)]">
          <p className="text-sm font-semibold">Through NEAR Intents</p>
          {tested ? (
            <>
              <p className="num mt-2 text-3xl">{usd(nearWorst!)}<span className="text-ink-soft text-xl"> – {usd(nearBest!)}</span></p>
              <p className="mt-1 text-sm text-ink-soft">arrives · cost <span className="num">{pct(c.nearLo)}–{pct(c.nearHi)}</span></p>
              <ul className="mt-3 space-y-1 text-xs text-muted">
                <li>Cash in ({c.sendCur} → USDT, P2P): <span className="num">{pct(Math.max(0, c.onRamp ?? 0))}</span></li>
                <li>Move across chains (NEAR Intents): <span className="num">{pct(legPct)}</span>, ~{Math.round(legSeconds)} s</li>
                <li>Cash out (USDT → {c.recvCur}, P2P): <span className="num">{pct(Math.max(0, c.offRamp ?? 0))}</span>{(c.offRampPremium ?? 0) > 0 && <> (sells {pct(c.offRampPremium)} above the official rate; not counted)</>}</li>
                <li>Allowance for worse fills and fees: <span className="num">{pct(buffer, 1)}</span></li>
              </ul>
            </>
          ) : (
            <p className="mt-3 text-sm text-ink-soft">{c.reason}. This corridor is left out of the verdict rather than guessed.</p>
          )}
        </div>
        <div className="flex md:flex-col items-center justify-center gap-2 md:px-2">
          <Pill verdict={c.verdict} size="lg" />
          {c.law === "banking-ban" && <span className="text-xs text-law text-center max-w-[9rem]">Banks may not touch crypto at one end</span>}
          {c.verdict === "wins" && c.keepPer200 != null && <span className="text-xs text-wins text-center max-w-[9rem]">Family keeps at least <span className="num">{usd(c.keepPer200)}</span> more</span>}
        </div>
      </div>

      <p className="mt-4 text-xs text-muted">
        {live?.ok ? (
          <>Live check: NEAR Intents quoted <span className="num">{usd(live.amountOut!)}</span> out of $200 ({live.route}, <span className="num">{pct(live.costPct)}</span>, ~{live.seconds} s) at {new Date(live.at!).toLocaleTimeString()}. The verdicts use the snapshot median of <span className="num">{pct(legPct)}</span>.</>
        ) : live ? (
          <>Live NEAR Intents quote unavailable right now; showing the snapshot median of {pct(legPct)}.</>
        ) : (
          <>Asking NEAR Intents for a live quote…</>
        )}
      </p>
    </div>
  );
}
