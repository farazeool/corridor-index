"use client";

import { useEffect, useRef, useState } from "react";

/** Counts from 0 to `to` when first visible. `format` turns the running number into text. */
export function CountUp({ to, format, duration = 1600 }: { to: number; format: "int" | "pct" | "usdB"; duration?: number }) {
  const [v, setV] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setV(to); return; }
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / duration);
        setV(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration]);
  const text = format === "int" ? Math.round(v).toLocaleString("en-US") : format === "pct" ? `${Math.round(v * 100)}%` : `$${(v / 1e9).toFixed(to < 1e11 ? 1 : 0)}B`;
  return <span ref={ref}>{text}</span>;
}
