"use client";

import { useEffect, useRef } from "react";

/** A thin gold line across the top that grows as you read down the page. */
export function Progress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = document.documentElement.scrollHeight - innerHeight;
        if (ref.current) ref.current.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
      });
    };
    on();
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); };
  }, []);
  return <div ref={ref} className="progress w-full" style={{ transform: "scaleX(0)" }} aria-hidden />;
}
