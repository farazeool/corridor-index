import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pill } from "@/components/Pill";
import { Embed } from "@/components/Embed";
import { T, country } from "@/lib/data";
import { pct, usd, usdB, VERDICT_LABEL } from "@/lib/format";

export const dynamicParams = false;
export function generateStaticParams() {
  return T.corridors.map((c) => ({ id: c.id }));
}

const find = (id: string) => T.corridors.find((c) => c.id === id);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const c = find((await params).id);
  if (!c) return {};
  const title = `${country(c.from)} → ${country(c.to)}: ${VERDICT_LABEL[c.verdict]}`;
  const description =
    c.nearLo != null && c.verdict !== "illegal"
      ? `Sending $200 costs ${pct(c.benchmark)} with today's providers and ${pct(c.nearLo)}–${pct(c.nearHi)} through NEAR Intents. Corridor Index, a re-runnable NEAR investment thesis.`
      : `${c.reason ?? ""}. Corridor Index, a re-runnable NEAR investment thesis.`;
  return { title, description, openGraph: { title, description }, twitter: { card: "summary_large_image", title, description } };
}

export default async function CorridorPage({ params }: { params: Promise<{ id: string }> }) {
  const c = find((await params).id);
  if (!c) notFound();
  const tested = c.nearLo != null && c.verdict !== "illegal";
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16 sm:py-24">
      <p className="eyebrow">Corridor Index · one corridor</p>
      <h1 className="mt-3 font-display text-4xl sm:text-6xl font-bold tracking-tight">
        {country(c.from)} <span className="text-blue">→</span> {country(c.to)}
      </h1>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Pill verdict={c.verdict} size="lg" />
        {c.volume != null && <span className="text-ink-soft">{usdB(c.volume)} sent a year</span>}
      </div>
      <div className="card mt-8 p-6 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-sm font-semibold">Today, per $200</p>
          <p className="num mt-2 text-3xl">{usd(200 * (1 - c.benchmark / 100))}</p>
          <p className="mt-1 text-sm text-ink-soft">arrives · cost <span className="num">{pct(c.benchmark)}</span> ({c.benchmarkKind})</p>
        </div>
        <div>
          <p className="text-sm font-semibold">Through NEAR Intents</p>
          {tested ? (
            <>
              <p className="num mt-2 text-3xl">{usd(200 * (1 - c.nearHi! / 100))} – {usd(200 * (1 - c.nearLo! / 100))}</p>
              <p className="mt-1 text-sm text-ink-soft">arrives · cost <span className="num">{pct(c.nearLo)}–{pct(c.nearHi)}</span>, cash in and out included</p>
            </>
          ) : (
            <p className="mt-2 text-ink-soft">{c.reason}</p>
          )}
        </div>
      </div>
      {c.verdict === "wins" && c.keepPer200 != null && (
        <p className="mt-5 text-lg">The family keeps at least <span className="num text-wins">{usd(c.keepPer200)}</span> more on every $200.</p>
      )}
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href={`/?from=${c.from}&to=${c.to}#calculator`} className="btn btn-primary">Open in the calculator</Link>
        <Link href="/#answer" className="btn">See the whole thesis</Link>
      </div>
      <Embed id={c.id} label={`${country(c.from)} to ${country(c.to)}: ${VERDICT_LABEL[c.verdict]}`} />
      <p className="mt-8 text-xs text-muted">World Bank Remittance Prices Worldwide (Q3 2025); NEAR side from live NEAR Intents quotes and peer-to-peer markets. Not investment advice.</p>
    </div>
  );
}
