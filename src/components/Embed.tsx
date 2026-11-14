"use client";
import { useState } from "react";

export function Embed({ id, label }: { id: string; label: string }) {
  const [done, setDone] = useState<string | null>(null);
  const base = typeof window === "undefined" ? "https://corridor-index-near.vercel.app" : location.origin;
  const md = `[![${label}](${base}/badge/${id}.svg)](${base}/c/${id})`;
  const html = `<a href="${base}/c/${id}"><img src="${base}/badge/${id}.svg" alt="${label}"></a>`;
  const copy = async (k: string, v: string) => { try { await navigator.clipboard.writeText(v); setDone(k); setTimeout(() => setDone(null), 1600); } catch {} };
  return (
    <div className="card mt-10 p-5">
      <p className="eyebrow">Embed this verdict</p>
      <p className="mt-2 text-sm text-ink-soft">A live badge for a README, blog or dashboard. It updates with every daily run.</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="mt-4" src={`/badge/${id}.svg`} alt={label} />
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="btn !py-1 !text-xs" onClick={() => copy("md", md)}>{done === "md" ? "Copied" : "Copy Markdown"}</button>
        <button className="btn !py-1 !text-xs" onClick={() => copy("html", html)}>{done === "html" ? "Copied" : "Copy HTML"}</button>
      </div>
    </div>
  );
}
