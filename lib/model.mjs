// The Corridor Index model. Every rule here is written down in the thesis before the
// numbers are looked at. Inputs are the normalised files in data/raw; output is data/thesis.json.
import { CURRENCY } from "./currencies.mjs";

export const RULES = {
  amountUsd: 200,
  // Extra cost allowed for worse peer-to-peer fills, network fees and a second ad.
  executionBufferPct: 1.0,
  // Kill criteria, fixed before the data was pulled.
  kill: {
    minWinShareOfTestedVolume: 0.25,
    adoptionForFeeTest: 0.1,
    // Protocol revenue (the part that reaches NEAR, not solvers) vs yearly new NEAR supply.
    minRevenueShareOfNewSupply: 0.05,
  },
  adoptionSteps: [0.01, 0.05, 0.1, 0.25],
};

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const r2 = (x) => (x == null ? null : Math.round(x * 100) / 100);

/** Cost of the NEAR Intents leg for a US$200 transfer, in percent, per route. */
export function intentsLeg(quotes, amount = RULES.amountUsd) {
  const rows = quotes.rows
    .filter((q) => q.amountIn === amount)
    .map((q) => ({ ...q, costPct: ((q.amountIn - q.amountOut) / q.amountIn) * 100 }));
  return { rows, medianPct: median(rows.map((r) => r.costPct)), medianSeconds: median(rows.map((r) => r.seconds)) };
}

/** Cost of turning local money into dollars (on-ramp) or back (off-ramp) on P2P, vs the mid rate. */
export function rampCosts(p2p) {
  const on = {}, off = {}, premium = {};
  for (const [c, price] of Object.entries(p2p.buy)) if (price && p2p.mid[c]) on[c] = (price / p2p.mid[c] - 1) * 100;
  for (const [c, price] of Object.entries(p2p.sell)) {
    if (!price || !p2p.mid[c] || c === "USD") continue;
    off[c] = (1 - price / p2p.mid[c]) * 100;
    if (off[c] < 0) premium[c] = -off[c];
  }
  on.USD = on.USD ?? 0;
  off.USD = 0; // dollarised receivers keep the dollars
  return { on, off, premium };
}

export function build({ rpw, volumes, quotes, p2p, chain, legality }) {
  const leg = intentsLeg(quotes);
  const ramps = rampCosts(p2p);
  const illegal = new Set(legality.illegal);
  const banking = new Set(legality.bankingBan);

  const corridors = rpw.corridors.map((c) => {
    const sendCur = CURRENCY[c.from], recvCur = CURRENCY[c.to];
    const volume = volumes.corridors[c.from + c.to] ?? null;
    // The harder bar for NEAR: the lower of the median provider and the online-provider average.
    const benchmark = c.digitalAvg != null ? Math.min(c.digitalAvg, c.median) : c.median;
    const benchmarkKind = c.digitalAvg != null && c.digitalAvg < c.median ? "online providers" : "median provider";
    const on = ramps.on[sendCur], off = ramps.off[recvCur];
    const row = {
      id: (c.from + c.to).toLowerCase(),
      from: c.from, to: c.to, sendCur, recvCur, volume,
      providers: c.providers, avg: c.avg, median: c.median, min: c.min, digitalAvg: c.digitalAvg,
      benchmark, benchmarkKind,
      onRamp: r2(on), offRamp: r2(off), offRampPremium: r2(ramps.premium[recvCur] ?? null),
      law: illegal.has(c.from) || illegal.has(c.to) ? "illegal" : banking.has(c.from) || banking.has(c.to) ? "banking-ban" : "ok",
    };
    if (on == null || off == null) return { ...row, verdict: "untested", reason: `No public P2P market observed for ${on == null ? sendCur : recvCur}` };
    const lo = Math.max(0, on) + leg.medianPct + Math.max(0, off);
    const hi = lo + RULES.executionBufferPct;
    const nearLo = r2(lo), nearHi = r2(hi);
    if (row.law === "illegal") return { ...row, nearLo, nearHi, verdict: "illegal", reason: "Crypto is illegal at one end of this corridor" };
    const verdict = hi < benchmark ? "wins" : lo > benchmark ? "loses" : "close";
    const keepPer200 = verdict === "wins" ? r2(((benchmark - hi) / 100) * RULES.amountUsd) : 0;
    return { ...row, nearLo, nearHi, verdict, keepPer200, beatsCheapest: hi < c.min };
  });

  const sum = (f) => corridors.reduce((a, c) => a + (f(c) ? c.volume ?? 0 : 0), 0);
  const count = (v) => corridors.filter((c) => c.verdict === v).length;
  const verdicts = ["wins", "close", "loses", "illegal", "untested"];
  const byVerdict = Object.fromEntries(verdicts.map((v) => [v, { corridors: count(v), volume: sum((c) => c.verdict === v) }]));
  const testedVolume = byVerdict.wins.volume + byVerdict.close.volume + byVerdict.loses.volume;
  const winShare = testedVolume ? byVerdict.wins.volume / testedVolume : 0;
  const familiesKeep = corridors.reduce((a, c) => a + (c.verdict === "wins" ? ((c.volume ?? 0) * (c.benchmark - c.nearHi)) / 100 : 0), 0);

  const vol1y = chain.defillama.volumeUsd.y1;
  const feeRate = chain.defillama.feesUsd.y1 / vol1y;
  const revRate = chain.defillama.revenueUsd.y1 / vol1y;
  const [num, den] = chain.nearRpc.maxInflationRate;
  const newSupplyNear = chain.nearRpc.totalSupplyNear * (num / den);
  const newSupplyUsd = newSupplyNear * chain.nearPriceUsd.price;
  const adoption = RULES.adoptionSteps.map((a) => {
    const flow = byVerdict.wins.volume * a;
    return { share: a, flowUsd: flow, feesUsd: flow * feeRate, revenueUsd: flow * revRate, revenueVsNewSupply: (flow * revRate) / newSupplyUsd, feesVsNewSupply: (flow * feeRate) / newSupplyUsd };
  });
  const at10 = adoption.find((a) => a.share === RULES.kill.adoptionForFeeTest);

  return {
    builtAt: new Date().toISOString(),
    rules: RULES,
    sources: {
      prices: { source: rpw.source, url: rpw.url, file: rpw.file, period: rpw.period, globalAverage: rpw.globalAverage },
      volumes: { source: volumes.source, url: volumes.url, file: volumes.file, year: volumes.year, worldTotalUsd: volumes.worldTotalUsd, note: volumes.note },
      quotes: { source: quotes.source, at: quotes.at },
      p2p: { source: p2p.source, url: p2p.url, at: p2p.at, midSource: p2p.midSource, midAt: p2p.midAt },
      chain: { fetchedAt: chain.fetchedAt, defillama: chain.defillama.source, price: chain.nearPriceUsd.source, rpc: chain.nearRpc.source },
      legality: { source: legality.source, pageLastEdited: legality.pageLastEdited },
    },
    countries: rpw.countries,
    intents: { legMedianPct: r2(leg.medianPct), legMedianSeconds: leg.medianSeconds, routes: leg.rows.map((r) => ({ from: r.from, to: r.to, costPct: r2(r.costPct), seconds: r.seconds })) },
    ramps: { on: Object.fromEntries(Object.entries(ramps.on).map(([k, v]) => [k, r2(v)])), off: Object.fromEntries(Object.entries(ramps.off).map(([k, v]) => [k, r2(v)])) },
    summary: {
      corridors: corridors.length,
      pricedVolume: sum(() => true),
      testedVolume,
      byVerdict,
      winShare,
      familiesKeepUsd: familiesKeep,
      intents: { volume1yUsd: vol1y, fees1yUsd: chain.defillama.feesUsd.y1, revenue1yUsd: chain.defillama.revenueUsd.y1, feeRate, revRate },
      near: { priceUsd: chain.nearPriceUsd.price, totalSupply: chain.nearRpc.totalSupplyNear, inflation: num / den, newSupplyNear, newSupplyUsd },
      adoption,
      kill: {
        winShare: { value: winShare, threshold: RULES.kill.minWinShareOfTestedVolume, passes: winShare >= RULES.kill.minWinShareOfTestedVolume },
        revenue: { value: at10.revenueVsNewSupply, threshold: RULES.kill.minRevenueShareOfNewSupply, passes: at10.revenueVsNewSupply >= RULES.kill.minRevenueShareOfNewSupply },
      },
    },
    corridors,
  };
}
