"use client";

import { useState } from "react";
import { share, usdB } from "@/lib/format";

export function WorthIt({ winVolume, revRate, feeRate, revenueToday, feesToday, newSupplyUsd, killShare }: {
  winVolume: number; revRate: number; feeRate: number; revenueToday: number; feesToday: number; newSupplyUsd: number; killShare: number;
}) {
  const [a, setA] = useState(0.1);
  const flow = winVolume * a;
  const revenue = flow * revRate;
  const fees = flow * feeRate;
  const bars: [string, number, string][] = [
    ["NEAR's new supply a year (2.5% inflation)", newSupplyUsd, "var(--incumbent)"],
    ["Intents protocol revenue today, all users", revenueToday, "var(--ink-soft)"],
    [`Extra revenue if ${share(a)} of winning corridors switched`, revenue, "var(--blue)"],
  ];
  const max = Math.max(...bars.map((b) => b[1]));
  return (
    <div className="card p-5 sm:p-7">
      <label className="block">
        <span className="text-sm font-semibold">Share of the winning corridors' money that moves to NEAR: <span className="num">{share(a, 0)}</span></span>
        <input type="range" min={0.01} max={0.25} step={0.01} value={a} onChange={(e) => setA(Number(e.target.value))} className="mt-2" aria-label="Adoption share" />
      </label>
      <div className="mt-6 space-y-4">
        {bars.map(([label, v, color]) => (
          <div key={label}>
            <div className="flex justify-between gap-4 text-sm"><span>{label}</span><span className="num">{usdB(v)}</span></div>
            <div className="mt-1.5 h-3 rounded-full bg-paper-deep overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(v / max) * 100}%`, background: color }} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm text-ink-soft">
        At {share(a)}, <span className="num">{usdB(flow)}</span> a year would cross NEAR Intents. Solvers and integrators would earn about{" "}
        <span className="num">{usdB(fees)}</span> in fees (today: {usdB(feesToday)}); the part that reaches the NEAR protocol is about{" "}
        <span className="num">{usdB(revenue)}</span>, or <strong className="num text-ink">{share(revenue / newSupplyUsd, 1)}</strong> of the NEAR minted each year.
        The kill line was {share(killShare)} at 10% adoption.
      </p>
    </div>
  );
}
