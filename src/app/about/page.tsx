import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { Section } from "@/components/Section";
import { WorthIt } from "@/components/WorthIt";
import { T } from "@/lib/data";
import { dateUtc, pct, share, usd, usdB } from "@/lib/format";
import { REPO_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "About: the thesis in full · Corridor Index",
  description: "Whether remittances matter for NEAR, the bear case, and how every number is made.",
};

const S = T.summary;
const k = S.kill;

export default function About() {
  return (
    <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
      <section className="pt-16 sm:pt-24">
        <p className="badge rise"><i />About · the thesis in full</p>
        <h1 className="display rise mt-5 font-extrabold leading-[0.95] text-[clamp(3rem,8vw,6.5rem)]" style={{ animationDelay: "120ms" }}>
          Useful first. <span className="accent font-normal text-blue">Valuable later.</span>
        </h1>
        <p className="rise mt-6 max-w-2xl text-xl text-ink-soft leading-snug" style={{ animationDelay: "260ms" }}>
          The calculator and the corridor table are on the <a className="link" href="/">home page</a>. This page asks what the result means for
          the NEAR token, what could make it wrong, and exactly how each number is made.
        </p>
        <nav className="rise mt-8 flex flex-wrap gap-2" style={{ animationDelay: "380ms" }}>
          <a href="#near" className="btn">For NEAR</a>
          <a href="#bear" className="btn">The bear case</a>
          <a href="#method" className="btn">Method and re-run</a>
          <a href="#project" className="btn">About the project</a>
        </nav>
      </section>

      {/* 6. For NEAR */}
      <Section id="near" n="01" kicker="Is it worth it for NEAR?" title="Useful for families long before it is meaningful for the token.">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          <WorthIt winVolume={S.byVerdict.wins.volume} revRate={S.intents.revRate} feeRate={S.intents.feeRate} revenueToday={S.intents.revenue1yUsd} feesToday={S.intents.fees1yUsd} newSupplyUsd={S.near.newSupplyUsd} killShare={k.revenue.threshold} />
          <div className="prose-thesis">
            <p>
              NEAR Intents moved <strong>{usdB(S.intents.volume1yUsd)}</strong> in the last year and charged {usdB(S.intents.fees1yUsd)} in fees,
              of which {usdB(S.intents.revenue1yUsd)} reached the protocol: a take of {pct(S.intents.revRate * 100, 3)} of volume.
            </p>
            <p>
              NEAR mints {share(S.near.inflation, 1)} of its {(S.near.totalSupply / 1e9).toFixed(2)} billion supply a year, about{" "}
              {usdB(S.near.newSupplyUsd)} at {usd(S.near.priceUsd)}. Today's Intents revenue covers {share(S.intents.revenue1yUsd / S.near.newSupplyUsd, 1)} of it.
            </p>
            <p>
              The winning corridors carry {usdB(S.byVerdict.wins.volume)} a year, <strong>{(S.byVerdict.wins.volume / S.intents.volume1yUsd).toFixed(0)} times</strong> what
              Intents moved last year. So remittances could multiply Intents' usage many times over. Turning that into value for NEAR holders depends on
              the take rate, not the volume.
            </p>
          </div>
        </div>
      </Section>

      {/* 7. Bear case */}
      <Section id="bear" n="02" kicker="What could make this wrong" title="The bear case, in full.">
        <ul className="grid gap-x-10 gap-y-6 md:grid-cols-2">
          {[
            ["Cash in and out is the weak link.", "The route depends on peer-to-peer markets: strangers, bank transfers that can be frozen, fraud. We price the top five public ads only; at scale, fills get worse. The stress-test slider shows how fast the wins shrink."],
            ["Some wins are regulatory arbitrage.", "In India, Pakistan and Egypt dollars sell well above the official rate on peer-to-peer markets. We never count that premium as a gain, but its existence shows controls that regulators can tighten."],
            ["The law closes doors.", `Crypto is illegal at one end of ${S.byVerdict.illegal.corridors} corridors, and banks are barred from it in Saudi Arabia, Qatar, Nigeria and others. Those corridors carry ${usdB(S.byVerdict.illegal.volume)} a year that NEAR cannot serve today.`],
            ["Incumbents keep getting cheaper.", `The world average is ${pct(T.sources.prices.globalAverage)}, but many Gulf → South Asia corridors already cost under 3% at the median provider, and some providers charge less than nothing. A cheaper rail only wins where today's price is high.`],
            ["The volumes are modelled.", "Corridor sizes come from the Center for Global Development's 2024 bilateral matrix, which allocates each country's total by migrant stocks. The authors call it indicative, not observed."],
            ["Little of it reaches the token.", "Fees mostly pay solvers and integrators. Even large adoption adds single-digit percentages of NEAR's yearly new supply."],
          ].map(([h, b]) => (
            <li key={h} className="border-t border-rule-strong pt-5">
              <p className="display text-lg font-semibold">{h}</p>
              <p className="mt-1.5 text-ink-soft">{b}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* 8. Method */}
      <Section id="method" n="03" kicker="Method and re-run" title="Every number comes from a public source and one command.">
        <div className="card p-5 sm:p-6">
          <pre className="num text-sm overflow-x-auto">{`git clone ${REPO_URL}\ncd corridor-index && npm install\nnpm run fetch    # pulls every source below into data/raw\nnpm run thesis   # rebuilds data/thesis.json and prints the verdict`}</pre>
        </div>
        <div className="mt-6 divide-y divide-rule border-y border-rule">
          {[
            ["What families pay today", `${T.sources.prices.source}. Period ${T.sources.prices.period}.`, T.sources.prices.url],
            ["How much each corridor carries", `${T.sources.volumes.source}. ${T.sources.volumes.note}`, T.sources.volumes.url],
            ["What NEAR Intents charges", `${T.sources.quotes.source}. Fetched ${dateUtc(T.sources.quotes.at)}; the page also asks for a live quote.`, "https://docs.near-intents.org"],
            ["Cash in and cash out", `${T.sources.p2p.source}, against mid-market rates from ${T.sources.p2p.midSource}. Fetched ${dateUtc(T.sources.p2p.at)}.`, T.sources.p2p.url],
            ["Intents volume, fees and revenue", `DefiLlama: ${T.sources.chain.defillama}. Fetched ${dateUtc(T.sources.chain.fetchedAt)}.`, "https://defillama.com/protocol/near-intents"],
            ["NEAR supply and inflation", `${T.sources.chain.rpc}; price from ${T.sources.chain.price}.`, "https://docs.near.org/api/rpc/protocol"],
            ["Where crypto is illegal", `Wikipedia, Legality of cryptocurrency by country or territory, last edited ${T.sources.legality.pageLastEdited}.`, T.sources.legality.source],
          ].map(([h, b, url]) => (
            <details key={h} className="py-4">
              <summary className="flex items-center justify-between gap-4 font-semibold">{h}<span className="text-muted text-sm">+</span></summary>
              <p className="mt-2 text-ink-soft">{b}</p>
              <a className="link text-sm" href={url}>{url}</a>
            </details>
          ))}
        </div>
        <div className="mt-8 prose-thesis max-w-3xl">
          <p>
            <strong>The rules.</strong> For each corridor, today&apos;s cost is the lower of the median provider and the average online provider, so NEAR is
            compared with the cheaper option. NEAR&apos;s cost is the premium paid to buy USDT with the sender&apos;s currency, plus the median Intents
            quote across {T.intents.routes.length} stablecoin routes, plus any discount when selling USDT for the receiver&apos;s currency. A premium on
            the selling side is ignored rather than counted as a gain. NEAR wins only if its cost plus a {T.rules.executionBufferPct}-point allowance is
            still below today&apos;s; it loses if its cost before the allowance is already above. Everything in between is too close to call.
          </p>
        </div>
      </Section>

      <Section id="project" n="04" kicker="About the project" title="Built at NEAR HACKATHON for the Investment Thesis track.">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="prose-thesis">
            <p>
              Corridor Index started from a simple question asked in Kuwait, where most workers send part of their pay home every month: would
              NEAR actually make that cheaper? Instead of arguing from NEAR&apos;s own chain data, it tests NEAR against the prices families pay today.
            </p>
            <p>
              Everything is open: the code, the raw data, the rules and the kill criteria. A GitHub Action re-runs the whole thesis every day.
            </p>
          </div>
          <div className="card p-6 text-sm text-ink-soft space-y-3">
            <p><span className="text-ink font-semibold">Code:</span> <a className="link" href={REPO_URL}>{REPO_URL.replace("https://", "")}</a></p>
            <p><span className="text-ink font-semibold">Data:</span> <a className="link" href="/data/thesis.json">thesis.json</a> · <a className="link" href="/data/corridors.csv">corridors.csv</a></p>
            <p><span className="text-ink font-semibold">Our other entry:</span> <a className="link" href="https://passpot.vercel.app">Passpot</a>, a rotating savings circle on NEAR (Social Money).</p>
            <p><span className="text-ink font-semibold">AI assistance:</span> code, data pipeline and copy were written with an AI coding assistant, directed and checked by the authors.</p>
            <p><span className="text-ink font-semibold">Not investment advice.</span> Numbers come from public sources and can be wrong; check them yourself with one command.</p>
          </div>
        </div>
      </Section>
    </div>
  );
}
