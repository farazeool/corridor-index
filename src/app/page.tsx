import { Calculator } from "@/components/Calculator";
import { CorridorTable } from "@/components/CorridorTable";
import { Dumbbell } from "@/components/Dumbbell";
import { Pill } from "@/components/Pill";
import { WorthIt } from "@/components/WorthIt";
import { T, country, type Corridor } from "@/lib/data";
import { dateUtc, pct, share, usd, usdB } from "@/lib/format";
import { REPO_URL } from "@/lib/site";

const S = T.summary;
const names = Object.fromEntries(Object.keys(T.countries).map((k) => [k, country(k)]));
const get = (f: string, t: string) => T.corridors.find((c) => c.from === f && c.to === t)!;
const tested = T.corridors.filter((c) => c.nearLo != null && c.verdict !== "illegal");
const testedCount = tested.length;
const top = [...tested].sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0)).slice(0, 18);
const kwPk = get("KWT", "PAK"), aeIn = get("ARE", "IND"), saBd = get("SAU", "BGD"), usMx = get("USA", "MEX");

function Stat({ value, label, href }: { value: string; label: string; href: string }) {
  return (
    <a href={href} className="block border-t-2 border-ink pt-3 group">
      <p className="text-3xl sm:text-4xl font-semibold tracking-tight tabular-nums">{value}</p>
      <p className="mt-1 text-sm text-ink-soft group-hover:text-ink">{label}</p>
    </a>
  );
}

function PassFail({ ok }: { ok: boolean }) {
  return (
    <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${ok ? "bg-wins-wash text-wins border-wins/40" : "bg-loses-wash text-loses border-loses/40"}`}>
      {ok ? "Passes" : "Fails"}
    </span>
  );
}

function Section({ id, kicker, title, children }: { id: string; kicker: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-24 scroll-mt-8">
      <p className="eyebrow">{kicker}</p>
      <h2 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight max-w-3xl">{title}</h2>
      <div className="mt-8">{children}</div>
    </section>
  );
}

export default function Home() {
  const k = S.kill;
  return (
    <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
      {/* 1. Calculator */}
      <section className="pt-12 sm:pt-16">
        <p className="eyebrow">An investment thesis for NEAR · Investment Thesis track</p>
        <h1 className="mt-3 text-4xl sm:text-6xl font-semibold tracking-tight max-w-4xl leading-[1.05]">
          Where NEAR actually wins at sending money home.
        </h1>
        <p className="mt-5 max-w-3xl prose-thesis">
          Most NEAR theses measure the chain from the inside. This one tests it against a real market: the{" "}
          {usdB(S.pricedVolume)} a year that migrants send home across {S.corridors} corridors the World Bank prices.
          Pick a corridor and compare what a family receives today with what they would receive through NEAR Intents.
        </p>
        <div className="mt-8">
          <Calculator corridors={T.corridors} names={names} legPct={T.intents.legMedianPct} legSeconds={T.intents.legMedianSeconds} buffer={T.rules.executionBufferPct} />
        </div>
      </section>

      {/* 2. Answer */}
      <Section id="answer" kicker="The answer" title={`NEAR's route is cheaper for ${share(S.winShare)} of the money we could test, but the token earns little from it.`}>
        <div className="grid gap-6 sm:grid-cols-3">
          <Stat value={`${S.byVerdict.wins.corridors} of ${testedCount}`} label={`corridors where NEAR wins, carrying ${usdB(S.byVerdict.wins.volume)} a year`} href="#corridors" />
          <Stat value={usdB(S.familiesKeepUsd)} label="a year families would keep if every winning corridor switched" href="#corridors" />
          <Stat value={share(S.adoption.find((a) => a.share === 0.1)!.revenueVsNewSupply, 1)} label="of NEAR's yearly new supply, paid by protocol revenue at 10% adoption" href="#near" />
        </div>
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_340px]">
          <div className="prose-thesis">
            <p>
              <strong>The bull case holds on cost.</strong> Moving dollars across chains through NEAR Intents costs about{" "}
              {pct(T.intents.legMedianPct)} for $200 and takes about {Math.round(T.intents.legMedianSeconds / 60)} minute
              {T.intents.legMedianSeconds >= 120 ? "s" : ""}. Even after buying the dollars and selling them again on local peer-to-peer
              markets, and allowing a full extra percentage point for bad fills, NEAR beats what families pay today in{" "}
              {S.byVerdict.wins.corridors} corridors. Those corridors carry {usdB(S.byVerdict.wins.volume)} a year,{" "}
              {share(S.winShare)} of the money we could test.
            </p>
            <p>
              <strong>It is not universal.</strong> In {S.byVerdict.loses.corridors} corridors NEAR loses outright, including some of the
              cheapest in the world: Kuwait → Pakistan already costs {pct(kwPk.benchmark)} at the median provider. In{" "}
              {S.byVerdict.illegal.corridors} corridors ({usdB(S.byVerdict.illegal.volume)} a year) crypto is illegal at one end, and{" "}
              {S.byVerdict.untested.corridors} more ({usdB(S.byVerdict.untested.volume)}) have no public peer-to-peer market to test against.
            </p>
            <p>
              <strong>The bear case holds on value.</strong> Most of what users pay goes to solvers and integrators, not to NEAR. If a tenth of
              the winning corridors' money moved to NEAR Intents, protocol revenue would rise by about{" "}
              {usdB(S.adoption.find((a) => a.share === 0.1)!.revenueUsd)} a year, against {usdB(S.near.newSupplyUsd)} of NEAR minted. Real, and
              above the kill line, but small. Remittances make NEAR useful long before they make the token scarce.
            </p>
          </div>
          <aside className="card p-5 self-start">
            <p className="eyebrow">Kill criteria, set before the data</p>
            <ul className="mt-4 space-y-4 text-sm">
              <li>
                <div className="flex items-center justify-between gap-3"><span>NEAR wins at least {share(k.winShare.threshold)} of tested volume</span><PassFail ok={k.winShare.passes} /></div>
                <p className="mt-1 text-muted">Result: <span className="num">{share(k.winShare.value, 1)}</span></p>
              </li>
              <li>
                <div className="flex items-center justify-between gap-3"><span>At 10% adoption, protocol revenue covers at least {share(k.revenue.threshold)} of new NEAR supply</span><PassFail ok={k.revenue.passes} /></div>
                <p className="mt-1 text-muted">Result: <span className="num">{share(k.revenue.value, 1)}</span></p>
              </li>
            </ul>
            <p className="mt-4 text-xs text-muted">Both re-check on every data run. If either fails, this page says so.</p>
          </aside>
        </div>
      </Section>

      {/* 3. Story */}
      <Section id="story" kicker="Four corridors" title="The same $200 tells four different stories.">
        <ol className="grid gap-5 md:grid-cols-2">
          {[
            { c: kwPk, head: "Already cheap. NEAR loses.", body: `The median provider charges ${pct(kwPk.benchmark)}: below zero, because some exchange houses give a better rate than the market. Buying dollars in Kuwait and selling them in Pakistan costs NEAR's route ${pct(kwPk.nearLo)}–${pct(kwPk.nearHi)}. Where competition is already fierce, a new rail adds nothing.` },
            { c: aeIn, head: "The biggest Gulf corridor. NEAR wins.", body: `${usdB(aeIn.volume ?? 0)} a year leaves the UAE for India. The median provider charges ${pct(aeIn.benchmark)}; NEAR's route ${pct(aeIn.nearLo)}–${pct(aeIn.nearHi)}. Dollars also sell for ${pct(aeIn.offRampPremium, 0)} more than the official rate on India's peer-to-peer market. We do not count that gain: it is a sign of demand, and a regulator's target.` },
            { c: saBd, head: "Expensive, and closed.", body: `Saudi Arabia → Bangladesh costs ${pct(saBd.benchmark)} online, one of the worst Gulf corridors, and NEAR would cost ${pct(saBd.nearLo)}–${pct(saBd.nearHi)}. But Bangladesh bans crypto. The corridors where NEAR could help most are often the ones where it is not allowed.` },
            { c: usMx, head: "The world's largest corridor. NEAR wins.", body: `${usdB(usMx.volume ?? 0)} a year goes from the US to Mexico. Online providers charge ${pct(usMx.benchmark)}; NEAR's route ${pct(usMx.nearLo)}–${pct(usMx.nearHi)}, because buying dollars costs nothing in the US and Mexico's peer-to-peer dollar price sits at the official rate.` },
          ].map(({ c, head, body }, i) => (
            <li key={i} className="card p-6">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted">{names[c.from]} → {names[c.to]}</p>
                <Pill verdict={c.verdict} />
              </div>
              <p className="mt-3 text-xl font-semibold">{head}</p>
              <p className="mt-2 prose-thesis !text-base">{body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* 4 + 5. Corridors */}
      <Section id="corridors" kicker="Every corridor" title={`NEAR is cheaper in ${S.byVerdict.wins.corridors} of the ${testedCount} corridors we could test.`}>
        <div className="card p-5 sm:p-6">
          <p className="font-semibold">Cost of sending $200: today <span className="inline-block w-2.5 h-2.5 rounded-full align-middle" style={{ background: "var(--incumbent)" }} /> vs through NEAR <span className="inline-block w-5 h-2.5 rounded-full align-middle bg-blue" /></p>
          <p className="text-sm text-muted">The {top.length} largest tested corridors by money sent. The dot at the right edge is the verdict.</p>
          <div className="mt-4"><Dumbbell rows={top} names={names} /></div>
          <p className="mt-3 text-xs text-muted">
            Today: World Bank Remittance Prices Worldwide, Q3 2025, lower of the median provider and the online-provider average. NEAR: peer-to-peer
            cash in and out (Binance P2P, {dateUtc(T.sources.p2p.at)}) plus the NEAR Intents dry-run quote ({dateUtc(T.sources.quotes.at)}), plus a {T.rules.executionBufferPct}-point allowance.
          </p>
        </div>
        <div className="mt-8"><CorridorTable corridors={T.corridors} names={names} baseBuffer={T.rules.executionBufferPct} /></div>
      </Section>

      {/* 6. For NEAR */}
      <Section id="near" kicker="Is it worth it for NEAR?" title="Useful for families long before it is meaningful for the token.">
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
      <Section id="bear" kicker="What could make this wrong" title="The bear case, in full.">
        <ul className="grid gap-x-10 gap-y-6 md:grid-cols-2">
          {[
            ["Cash in and out is the weak link.", "The route depends on peer-to-peer markets: strangers, bank transfers that can be frozen, fraud. We price the top five public ads only; at scale, fills get worse. The stress-test slider shows how fast the wins shrink."],
            ["Some wins are regulatory arbitrage.", "In India, Pakistan and Egypt dollars sell well above the official rate on peer-to-peer markets. We never count that premium as a gain, but its existence shows controls that regulators can tighten."],
            ["The law closes doors.", `Crypto is illegal at one end of ${S.byVerdict.illegal.corridors} corridors, and banks are barred from it in Saudi Arabia, Qatar, Nigeria and others. Those corridors carry ${usdB(S.byVerdict.illegal.volume)} a year that NEAR cannot serve today.`],
            ["Incumbents keep getting cheaper.", `The world average is ${pct(T.sources.prices.globalAverage)}, but many Gulf → South Asia corridors already cost under 3% at the median provider, and some providers charge less than nothing. A cheaper rail only wins where today's price is high.`],
            ["The volumes are modelled.", "Corridor sizes come from the Center for Global Development's 2024 bilateral matrix, which allocates each country's total by migrant stocks. The authors call it indicative, not observed."],
            ["Little of it reaches the token.", "Fees mostly pay solvers and integrators. Even large adoption adds single-digit percentages of NEAR's yearly new supply."],
          ].map(([h, b]) => (
            <li key={h} className="border-t border-rule pt-4">
              <p className="font-semibold">{h}</p>
              <p className="mt-1.5 text-ink-soft">{b}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* 8. Method */}
      <Section id="method" kicker="Method and re-run" title="Every number comes from a public source and one command.">
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
    </div>
  );
}
