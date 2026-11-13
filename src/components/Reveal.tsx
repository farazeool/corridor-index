"use client";

import { useEffect, useRef } from "react";

/** Fades and lifts its children into view the first time they scroll on screen. */
export function Reveal({ children, delay = 0, className = "", as: Tag = "div" }: { children: React.ReactNode; delay?: number; className?: string; as?: "div" | "li" | "section" }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("in"); io.disconnect(); } },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const Comp = Tag as "div";
  return (
    <Comp ref={ref as React.RefObject<HTMLDivElement>} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </Comp>
  );
}
