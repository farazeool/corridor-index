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
  corridors, names, legPct, legPct500, legSeconds, buffer,
}: { corridors: Corridor[]; names: Record<string, string>; legPct: number; legPct500: number | null; legSeconds: number; buffer: number }) {
  const [amount, setAmount] = useState<200 | 500>(200);
  const [from, setFrom] = useState("KWT");
  const [to, setTo] = useState("PAK");
  const [live, setLive] = useState<Live | null>(null);
  const [copied, setCopied] = useState(false);

  // Read a shared corridor from the address (?from=ARE&to=IND) and keep the address in step.
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const f = q.get("from")?.toUpperCase(), t = q.get("to")?.toUpperCase();
    if (f && t && corridors.some((c) => c.from === f && c.to === t)) { setFrom(f); setTo(t); }
  }, [corridors]);

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

  useEffect(() => {
    const u = new URL(location.href);
    if (u.searchParams.get("from") === c.from && u.searchParams.get("to") === c.to) return;
    if (c.from === "KWT" && c.to === "PAK" && !u.searchParams.get("from")) return;
    u.searchParams.set("from", c.from); u.searchParams.set("to", c.to);
    history.replaceState(null, "", u.pathname + u.search + "#calculator");
  }, [c.from, c.to]);

  const share = async () => {
    const u = new URL(location.href);
    u.searchParams.set("from", c.from); u.searchParams.set("to", c.to); u.hash = "calculator";
    try { await navigator.clipboard.writeText(u.toString()); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard blocked */ }
  };

  // The same corridor at US$200 or US$500 (World Bank prices both).
  const big = amount === 500 && c.at500 ? c.at500 : null;
  const v = {
    benchmark: big ? big.benchmark : c.benchmark,
    benchmarkKind: big ? big.benchmarkKind : c.benchmarkKind,
    min: big ? big.min : c.min,
    providers: big ? big.providers : c.providers,
    nearLo: big ? big.nearLo : c.nearLo,
    nearHi: big ? big.nearHi : c.nearHi,
    verdict: big ? big.verdict : c.verdict,
    keep: big ? big.keep : c.keepPer200,
    leg: amount === 500 && legPct500 != null ? legPct500 : legPct,
  };
  const today = amount * (1 - v.benchmark / 100);
  const tested = v.nearLo != null;
  const nearBest = tested ? amount * (1 - v.nearLo! / 100) : null;
  const nearWorst = tested ? amount * (1 - v.nearHi! / 100) : null;

  return (
    <div className="card p-5 sm:p-7">
      <div className="flex flex-wrap items-end gap-3">
        <label className="grow basis-40">
          <span className="eyebrow">Send ${amount} from</span>
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
      <div className="mt-4 flex items-center gap-2" role="group" aria-label="Amount">
        <span className="text-xs text-muted mr-1">Amount</span>
        {([200, 500] as const).map((a) => (
          <button key={a} className="btn !py-1 !text-xs" aria-pressed={amount === a} onClick={() => setAmount(a)} disabled={a === 500 && !c.at500}>${a}</button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {PRESETS.map(([f, t, label]) => (
          <button key={label} className="btn !py-1 !text-xs" aria-pressed={from === f && c.to === t} onClick={() => { setFrom(f); setTo(t); }}>
            {label}
          </button>
        ))}
        <button className="btn !py-1 !text-xs ml-auto" onClick={share} aria-live="polite">{copied ? "Link copied" : "Copy link to this corridor"}</button>
      </div>

      <div className="relative mt-6 grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-stretch">
        <svg key={c.id + amount} className="flight pointer-events-none absolute left-0 top-0 hidden md:block h-full w-full overflow-visible" aria-hidden>
          <g className="flight-plane"><path d="M11 0 -8 -7 -4 0 -8 7Z" fill="var(--blue)" /><path d="M11 0 -4 0 -8 7Z" fill="#b8862f" /></g>
        </svg>
        <div className="rounded-2xl border border-rule bg-[rgba(255,255,255,0.02)] p-5">
          <p className="text-sm font-semibold">{v.benchmarkKind === "online providers" ? "Online providers today" : "A typical provider today"}</p>
          <p className="num mt-2 text-3xl">{usd(today)}</p>
          <p className="mt-1 text-sm text-ink-soft">arrives · cost <span className="num">{pct(v.benchmark)}</span></p>
          <p className="mt-3 text-xs text-muted">
            World Bank, Q3 2025, {v.providers} providers checked for ${amount}. Cheapest: <span className="num">{pct(v.min)}</span>.
          </p>
        </div>
        <div className="rounded-2xl border border-blue/60 bg-blue-wash p-5 shadow-[0_0_60px_-20px_var(--blue)]">
          <p className="text-sm font-semibold">Through NEAR Intents</p>
          {tested ? (
            <>
              <p className="num mt-2 text-3xl">{usd(nearWorst!)}<span className="text-ink-soft text-xl"> – {usd(nearBest!)}</span></p>
              <p className="mt-1 text-sm text-ink-soft">arrives · cost <span className="num">{pct(v.nearLo)}–{pct(v.nearHi)}</span></p>
              <ul className="mt-3 space-y-1 text-xs text-muted">
                <li>Cash in ({c.sendCur} → USDT, P2P): <span className="num">{pct(Math.max(0, c.onRamp ?? 0))}</span></li>
                <li>Move across chains (NEAR Intents): <span className="num">{pct(v.leg)}</span>, ~{Math.round(legSeconds)} s</li>
                <li>Cash out (USDT → {c.recvCur}, P2P): <span className="num">{pct(Math.max(0, c.offRamp ?? 0))}</span>{(c.offRampPremium ?? 0) > 0 && <> (sells {pct(c.offRampPremium)} above the official rate; not counted)</>}</li>
                <li>Allowance for worse fills and fees: <span className="num">{pct(buffer, 1)}</span></li>
              </ul>
            </>
          ) : (
            <p className="mt-3 text-sm text-ink-soft">{c.reason}. This corridor is left out of the verdict rather than guessed.</p>
          )}
        </div>
        <div className="flex md:flex-col items-center justify-center gap-2 md:px-2">
          <Pill verdict={v.verdict} size="lg" />
          {c.law === "banking-ban" && <span className="text-xs text-law text-center max-w-[9rem]">Banks may not touch crypto at one end</span>}
          {v.verdict === "wins" && v.keep != null && <span className="text-xs text-wins text-center max-w-[9rem]">Family keeps at least <span className="num">{usd(v.keep)}</span> more</span>}
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
