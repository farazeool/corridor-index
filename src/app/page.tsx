import { Calculator } from "@/components/Calculator";
import { CorridorArcs } from "@/components/CorridorArcs";
import { CountUp } from "@/components/CountUp";
import { Reveal } from "@/components/Reveal";
import { PassFail, Section } from "@/components/Section";
import { Ticker } from "@/components/Ticker";
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

export default function Home() {
  const k = S.kill;
  return (
    <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
      {/* 0. Hero */}
      <section className="relative -mx-4 sm:-mx-6 px-4 sm:px-6 pt-16 sm:pt-24 pb-10 min-h-[86vh] flex flex-col justify-center overflow-hidden">
        <div className="absolute inset-x-0 top-[22%] bottom-0 -z-10 opacity-60 sm:opacity-75"><CorridorArcs corridors={T.corridors} /></div>
        <p className="badge rise" style={{ animationDelay: "60ms" }}><i />Investment Thesis · NEAR HACKATHON</p>
        <h1 className="display rise mt-5 font-extrabold leading-[0.88] text-[clamp(4rem,13vw,11rem)]" style={{ animationDelay: "160ms" }}>
          Corridor <span className="accent font-normal text-blue">Index</span>
        </h1>
        <p className="rise mt-6 max-w-2xl text-xl sm:text-2xl text-ink-soft leading-snug" style={{ animationDelay: "320ms" }}>
          Where NEAR actually wins at sending money home, tested against{" "}
          <span className="text-ink">{usdB(S.pricedVolume)}</span> a year of real remittances.
        </p>
        <div className="rise mt-9 flex flex-wrap gap-3" style={{ animationDelay: "460ms" }}>
          <a href="#calculator" className="btn btn-primary !px-5 !py-2.5">Try a corridor</a>
          <a href="#answer" className="btn !px-5 !py-2.5">Read the verdict</a>
        </div>
        <div className="rise mt-14 grid max-w-3xl grid-cols-3 gap-6" style={{ animationDelay: "620ms" }}>
          <div><p className="display text-3xl sm:text-5xl font-semibold"><CountUp to={S.corridors} format="int" /></p><p className="mt-1 text-xs sm:text-sm text-muted">corridors priced by the World Bank</p></div>
          <div><p className="display text-3xl sm:text-5xl font-semibold text-wins"><CountUp to={S.winShare} format="pct" /></p><p className="mt-1 text-xs sm:text-sm text-muted">of tested money where NEAR is cheaper</p></div>
          <div><p className="display text-3xl sm:text-5xl font-semibold"><CountUp to={S.byVerdict.wins.volume} format="usdB" /></p><p className="mt-1 text-xs sm:text-sm text-muted">a year in corridors NEAR wins</p></div>
        </div>
        <div className="rise mt-10 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted" style={{ animationDelay: "760ms" }}>
          {(["wins", "close", "loses", "illegal"] as const).map((v) => (
            <span key={v} className="flex items-center gap-2"><span className="h-0.5 w-5 rounded" style={{ background: `var(--${v === "illegal" ? "law" : v})` }} />{{ wins: "NEAR cheaper", close: "too close", loses: "NEAR dearer", illegal: "crypto illegal" }[v]}</span>
          ))}
          <span>The 22 largest corridors, drawn from where the money is sent to where it lands.</span>
        </div>
      </section>

      <div className="-mx-4 sm:-mx-6"><Ticker corridors={T.corridors} names={names} /></div>

      {/* 1. Calculator */}
      <section id="calculator" className="mt-16 scroll-mt-20">
        <Reveal>
          <p className="eyebrow flex items-center gap-3"><span className="secnum">01</span><span className="inline-block h-px w-8 bg-blue" />Try a corridor</p>
          <h2 className="display mt-4 text-4xl sm:text-6xl font-semibold max-w-4xl leading-[1.02]">Send $200. See who keeps <span className="accent font-normal">more.</span></h2>
          <p className="mt-5 max-w-3xl prose-thesis">
            Most NEAR theses measure the chain from the inside. This one tests it against a real market: what a family receives today, from the
            World Bank&apos;s price survey, against what it would receive if the money went through NEAR Intents, cash in and cash out included.
          </p>
        </Reveal>
        <Reveal delay={120} className="mt-10">
          <Calculator corridors={T.corridors} names={names} legPct={T.intents.legMedianPct} legPct500={S.at500?.legMedianPct ?? null} legSeconds={T.intents.legMedianSeconds} buffer={T.rules.executionBufferPct} />
        </Reveal>
      </section>

      {/* 2. Answer */}
      <Section id="answer" n="02" kicker="The answer" title={`NEAR's route is cheaper for ${share(S.winShare)} of the money we could test, but the token earns little from it.`}>
        <div className="grid gap-4 md:grid-cols-6">
          <a href="#corridors" className="card lift p-7 md:col-span-3 md:row-span-2 flex flex-col justify-between min-h-[15rem] relative overflow-hidden">
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(61,220,151,0.22),transparent_70%)]" aria-hidden />
            <p className="eyebrow">Where NEAR is cheaper</p>
            <div>
              <p className="display text-6xl sm:text-7xl font-semibold text-wins"><CountUp to={S.winShare} format="pct" /></p>
              <p className="mt-2 text-ink-soft">of the money we could test: {S.byVerdict.wins.corridors} of {testedCount} corridors, {usdB(S.byVerdict.wins.volume)} a year.</p>
            </div>
          </a>
          <a href="#corridors" className="card lift p-6 md:col-span-3">
            <p className="eyebrow">Families would keep</p>
            <p className="display mt-3 text-4xl font-semibold"><CountUp to={S.familiesKeepUsd} format="usdB" /> <span className="text-ink-soft text-xl font-normal">a year</span></p>
            <p className="mt-1 text-sm text-muted">if every winning corridor switched to NEAR</p>
          </a>
          <a href="/about#near" className="card lift p-6 md:col-span-3">
            <p className="eyebrow">What reaches NEAR</p>
            <p className="display mt-3 text-4xl font-semibold text-blue">{share(S.adoption.find((a) => a.share === 0.1)!.revenueVsNewSupply, 1)}</p>
            <p className="mt-1 text-sm text-muted">of NEAR&apos;s yearly new supply, paid by protocol revenue at 10% adoption</p>
          </a>
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
            {S.at500 && (
              <p>
                <strong>Bigger transfers are a harder test.</strong> At $500, fixed fees weigh less for banks and exchange houses, and NEAR is
                cheaper for {share(S.at500.winShare)} of the tested money instead of {share(S.winShare)}. Switch the calculator to $500 to see it
                corridor by corridor.
              </p>
            )}
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
      <Section id="story" n="03" kicker="Four corridors" title="The same $200 tells four different stories.">
        <ol className="grid gap-5 md:grid-cols-2">
          {[
            { c: kwPk, head: "Already cheap. NEAR loses.", body: `The median provider charges ${pct(kwPk.benchmark)}: below zero, because some exchange houses give a better rate than the market. Buying dollars in Kuwait and selling them in Pakistan costs NEAR's route ${pct(kwPk.nearLo)}–${pct(kwPk.nearHi)}. Where competition is already fierce, a new rail adds nothing.` },
            { c: aeIn, head: "The biggest Gulf corridor. NEAR wins.", body: `${usdB(aeIn.volume ?? 0)} a year leaves the UAE for India. The median provider charges ${pct(aeIn.benchmark)}; NEAR's route ${pct(aeIn.nearLo)}–${pct(aeIn.nearHi)}. Dollars also sell for ${pct(aeIn.offRampPremium, 0)} more than the official rate on India's peer-to-peer market. We do not count that gain: it is a sign of demand, and a regulator's target.` },
            { c: saBd, head: "Expensive, and closed.", body: `Saudi Arabia → Bangladesh costs ${pct(saBd.benchmark)} online, one of the worst Gulf corridors, and NEAR would cost ${pct(saBd.nearLo)}–${pct(saBd.nearHi)}. But Bangladesh bans crypto. The corridors where NEAR could help most are often the ones where it is not allowed.` },
            { c: usMx, head: "The world's largest corridor. NEAR wins.", body: `${usdB(usMx.volume ?? 0)} a year goes from the US to Mexico. Online providers charge ${pct(usMx.benchmark)}; NEAR's route ${pct(usMx.nearLo)}–${pct(usMx.nearHi)}, because buying dollars costs nothing in the US and Mexico's peer-to-peer dollar price sits at the official rate.` },
          ].map(({ c, head, body }, i) => (
            <Reveal as="li" key={i} delay={i * 110} className="card lift p-7">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted">{names[c.from]} → {names[c.to]}</p>
                <Pill verdict={c.verdict} />
              </div>
              <p className="display mt-4 text-2xl font-semibold">{head}</p>
              <p className="mt-2 prose-thesis !text-base">{body}</p>
            </Reveal>
          ))}
        </ol>
      </Section>

      {/* 4 + 5. Corridors */}
      <Section id="corridors" n="04" kicker="Every corridor" title={`NEAR is cheaper in ${S.byVerdict.wins.corridors} of the ${testedCount} corridors we could test.`}>
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

      {/* Continue to About */}
      <section className="mt-32 sm:mt-40">
        <Reveal>
          <a href="/about" className="card lift group grid gap-6 p-8 sm:p-10 md:grid-cols-[1fr_auto] md:items-end overflow-hidden relative">
            <div className="absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(232,194,122,0.22),transparent_70%)]" aria-hidden />
            <div>
              <p className="eyebrow">The thesis in full</p>
              <p className="display mt-3 text-3xl sm:text-5xl font-semibold leading-tight max-w-3xl">Is it worth it for NEAR, what could make this wrong, and how every number is made.</p>
            </div>
            <span className="btn btn-primary !px-5 !py-2.5 w-max">Read the rest →</span>
          </a>
        </Reveal>
      </section>
    </div>
  );
}
