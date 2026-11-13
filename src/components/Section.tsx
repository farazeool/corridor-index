import { Reveal } from "./Reveal";

export function PassFail({ ok }: { ok: boolean }) {
  return (
    <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${ok ? "bg-wins-wash text-wins border-wins/40" : "bg-loses-wash text-loses border-loses/40"}`}>
      {ok ? "Passes" : "Fails"}
    </span>
  );
}

export function Section({ id, n, kicker, title, children }: { id: string; n: string; kicker: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-32 sm:mt-40 scroll-mt-20">
      <Reveal>
        <p className="eyebrow flex items-center gap-3"><span className="secnum">{n}</span><span className="inline-block h-px w-8 bg-blue" />{kicker}</p>
        <h2 className="display mt-4 text-4xl sm:text-6xl font-semibold max-w-4xl leading-[1.02]">{title}</h2>
      </Reveal>
      <Reveal delay={120} className="mt-10">{children}</Reveal>
    </section>
  );
}

