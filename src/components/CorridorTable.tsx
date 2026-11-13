"use client";

import { useMemo, useState } from "react";
import type { Corridor, Verdict } from "@/lib/data";
import { pct, share, usd, usdB } from "@/lib/format";
import { Pill } from "./Pill";

const TABS: [string, string][] = [
  ["tested", "Tested"],
  ["wins", "NEAR wins"],
  ["close", "Too close"],
  ["loses", "NEAR loses"],
  ["illegal", "Crypto illegal"],
  ["untested", "Can't test"],
  ["all", "All 348"],
];
type SortKey = "volume" | "benchmark" | "near" | "gap";

function verdictAt(c: Corridor, buffer: number): Verdict {
  if (c.verdict === "illegal" || c.verdict === "untested" || c.nearLo == null) return c.verdict;
  const hi = c.nearLo + buffer;
  return hi < c.benchmark ? "wins" : c.nearLo > c.benchmark ? "loses" : "close";
}

export function CorridorTable({ corridors, names, baseBuffer }: { corridors: Corridor[]; names: Record<string, string>; baseBuffer: number }) {
  const [buffer, setBuffer] = useState(baseBuffer);
  const [tab, setTab] = useState("tested");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("volume");
  const [all, setAll] = useState(false);

  const rows = useMemo(() => corridors.map((c) => ({ ...c, v: verdictAt(c, buffer), hi: c.nearLo != null ? c.nearLo + buffer : null })), [corridors, buffer]);
  const stats = useMemo(() => {
    const vol = (f: (r: (typeof rows)[number]) => boolean) => rows.reduce((a, r) => a + (f(r) ? r.volume ?? 0 : 0), 0);
    const tested = vol((r) => r.v === "wins" || r.v === "close" || r.v === "loses");
    const wins = vol((r) => r.v === "wins");
    return { tested, wins, n: rows.filter((r) => r.v === "wins").length };
  }, [rows]);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = rows.filter((r) =>
      tab === "all" ? true : tab === "tested" ? ["wins", "close", "loses"].includes(r.v) : r.v === tab,
    );
    if (term) list = list.filter((r) => `${names[r.from]} ${names[r.to]} ${r.from} ${r.to}`.toLowerCase().includes(term));
    const key = (r: (typeof rows)[number]) =>
      sort === "volume" ? -(r.volume ?? 0) : sort === "benchmark" ? -r.benchmark : sort === "near" ? r.hi ?? 99 : -((r.benchmark - (r.hi ?? 99)));
    return [...list].sort((a, b) => key(a) - key(b));
  }, [rows, tab, q, sort, names]);

  const th = (k: SortKey, label: string) => (
    <th className="px-3 py-2 font-semibold text-right whitespace-nowrap">
      <button className={`hover:text-ink ${sort === k ? "text-ink underline underline-offset-4" : ""}`} onClick={() => setSort(k)}>{label}</button>
    </th>
  );

  return (
    <div>
      <div className="card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="grow basis-72">
            <span className="text-sm font-semibold">Stress test: allow <span className="num">{buffer.toFixed(1)}</span> percentage points for worse fills and fees</span>
            <input type="range" min={0} max={4} step={0.5} value={buffer} onChange={(e) => setBuffer(Number(e.target.value))} className="mt-2" aria-label="Execution allowance in percentage points" />
          </label>
          <p className="text-sm text-ink-soft max-w-sm">
            NEAR wins <strong className="num text-ink">{stats.n}</strong> corridors and{" "}
            <strong className="num text-ink">{share(stats.tested ? stats.wins / stats.tested : 0)}</strong> of the money we could test
            ({usdB(stats.wins)} of {usdB(stats.tested)} a year).
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {TABS.map(([k, label]) => (
          <button key={k} className="btn !py-1 !text-xs" aria-pressed={tab === k} onClick={() => { setTab(k); setAll(false); }}>{label}</button>
        ))}
        <input className="field !w-56 ml-auto !py-1.5 text-sm" placeholder="Search a country" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search corridors" />
      </div>

      <div className="mt-3 overflow-x-auto rounded-[6px] border border-rule">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-paper-deep text-left text-muted">
            <tr>
              <th className="px-3 py-2 font-semibold">Verdict</th>
              <th className="px-3 py-2 font-semibold">Corridor</th>
              {th("volume", "Sent a year")}
              {th("benchmark", "Cost today")}
              {th("near", "Cost via NEAR")}
              {th("gap", "Family keeps per $200")}
              <th className="px-3 py-2 font-semibold">Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {(all ? shown : shown.slice(0, 25)).map((r) => (
              <tr key={r.id} className="align-top hover:bg-[rgba(255,255,255,0.025)] transition-colors">
                <td className="px-3 py-2.5"><Pill verdict={r.v} /></td>
                <td className="px-3 py-2.5 font-medium min-w-[12rem]">{names[r.from]} → {names[r.to]}</td>
                <td className="px-3 py-2.5 text-right num">{r.volume != null ? usdB(r.volume) : "–"}</td>
                <td className="px-3 py-2.5 text-right num">{pct(r.benchmark)}</td>
                <td className="px-3 py-2.5 text-right num whitespace-nowrap">{r.nearLo != null ? `${pct(r.nearLo)}–${pct(r.hi)}` : "–"}</td>
                <td className={`px-3 py-2.5 text-right num ${r.v === "wins" ? "text-wins" : "text-muted"}`}>
                  {r.v === "wins" && r.hi != null ? `+${usd(((r.benchmark - r.hi) / 100) * 200)}` : "–"}
                </td>
                <td className="px-3 py-2.5 text-xs text-muted max-w-[16rem]">
                  {r.v === "untested" ? r.reason : r.v === "illegal" ? "Crypto is illegal at one end" : r.law === "banking-ban" ? "Banks barred from crypto at one end" : (r.offRampPremium ?? 0) > 3 ? `Dollars sell ${pct(r.offRampPremium, 0)} above the official rate (not counted)` : r.beatsCheapest ? "Beats even the cheapest provider" : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
        {shown.length > 25 && (
          <button className="btn" onClick={() => setAll(!all)}>{all ? "Show fewer" : `Show all ${shown.length}`}</button>
        )}
        <a className="link" href="/data/corridors.csv">Download every corridor as CSV</a>
        <span className="text-muted">Cost today = the lower of the median provider and the online-provider average (World Bank, Q3 2025).</span>
      </div>
    </div>
  );
}
