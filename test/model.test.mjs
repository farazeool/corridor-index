import { test } from "node:test";
import assert from "node:assert/strict";
import { build, intentsLeg, rampCosts, RULES } from "../lib/model.mjs";

const base = () => ({
  rpw: { source: "t", url: "u", file: "f", period: "2025_3Q", globalAverage: 6.36, countries: {},
    corridors: [
      { from: "USA", to: "MEX", providers: 10, avg: 5, median: 4.5, min: 1, digitalAvg: 4 },   // NEAR cheap
      { from: "KWT", to: "PAK", providers: 10, avg: 0.3, median: 0.2, min: -1, digitalAvg: 0.5 }, // already cheap
      { from: "ARE", to: "IND", providers: 10, avg: 3, median: 2.0, min: 1, digitalAvg: 3 },  // close
      { from: "SAU", to: "BGD", providers: 10, avg: 9, median: 8, min: 6, digitalAvg: 7 },     // illegal at receiver
      { from: "GBR", to: "NGA", providers: 10, avg: 2, median: 2, min: 1, digitalAvg: 2 },     // no NGN market
    ] },
  volumes: { source: "t", url: "u", file: "f", year: 2024, worldTotalUsd: 1, note: "", corridors: { USAMEX: 100e9, KWTPAK: 2e9, AREIND: 20e9, SAUBGD: 8e9, GBRNGA: 3e9 } },
  quotes: { source: "t", at: "2026-11-13T00:00:00Z", rows: [
    { from: "a", to: "b", amountIn: 200, amountOut: 199.3, seconds: 90 },
    { from: "a", to: "c", amountIn: 200, amountOut: 199.5, seconds: 30 },
    { from: "a", to: "d", amountIn: 200, amountOut: 199.1, seconds: 100 },
    { from: "a", to: "b", amountIn: 500, amountOut: 499.5, seconds: 90 },
  ] },
  p2p: { source: "t", url: "u", at: "x", midSource: "m", midAt: "y",
    buy: { USD: 1, KWD: 0.31, AED: 3.7, SAR: 3.8, GBP: 0.8 },
    sell: { MXN: 18.6, PKR: 290, INR: 105, BDT: 125 },
    mid: { USD: 1, KWD: 0.3, AED: 3.6725, SAR: 3.75, GBP: 0.8, MXN: 18.6, PKR: 280, INR: 94, BDT: 124 } },
  chain: { fetchedAt: "z", defillama: { source: "d", volumeUsd: { y1: 30e9 }, feesUsd: { y1: 50e6 }, revenueUsd: { y1: 9e6 } },
    nearPriceUsd: { source: "p", price: 3.5 }, nearRpc: { source: "r", totalSupplyNear: 1.3e9, maxInflationRate: [1, 40] } },
  legality: { source: "w", pageLastEdited: "x", illegal: ["BGD"], bankingBan: ["SAU"] },
});
const by = (out, f, t) => out.corridors.find((c) => c.from === f && c.to === t);

test("the Intents leg is the median $200 quote, ignoring other amounts", () => {
  const leg = intentsLeg(base().quotes);
  assert.equal(leg.rows.length, 3);
  assert.ok(Math.abs(leg.medianPct - 0.35) < 1e-9);
});

test("a selling premium is reported but never counted as a gain", () => {
  const r = rampCosts(base().p2p);
  assert.ok(r.off.PKR < 0);
  assert.ok(r.premium.PKR > 3);
  const out = build(base());
  const kp = by(out, "KWT", "PAK");
  // cash in 3.33% + leg 0.35% + cash out counted as 0, not -3.57%
  assert.ok(Math.abs(kp.nearLo - (3.33 + 0.35)) < 0.02);
});

test("the benchmark is the cheaper of the median and the online average", () => {
  const out = build(base());
  assert.equal(by(out, "USA", "MEX").benchmark, 4);
  assert.equal(by(out, "ARE", "IND").benchmark, 2);
});

test("verdicts follow the written rules", () => {
  const out = build(base());
  assert.equal(by(out, "USA", "MEX").verdict, "wins"); // 0.35 + 1 < 4
  assert.equal(by(out, "KWT", "PAK").verdict, "loses"); // 3.68 > 0.2
  assert.equal(by(out, "ARE", "IND").verdict, "close"); // 1.1 <= 2 <= 2.1
  assert.equal(by(out, "SAU", "BGD").verdict, "illegal");
  assert.equal(by(out, "GBR", "NGA").verdict, "untested");
});

test("a wider execution allowance can only make NEAR win less", () => {
  const before = build(base());
  RULES.executionBufferPct = 3.7;
  const after = build(base());
  RULES.executionBufferPct = 1.0;
  assert.ok(after.summary.byVerdict.wins.volume <= before.summary.byVerdict.wins.volume);
  assert.equal(by(after, "USA", "MEX").verdict, "close");
});

test("kill criteria and sizing are computed from the winning volume", () => {
  const s = build(base()).summary;
  assert.equal(s.byVerdict.wins.volume, 100e9);
  assert.ok(Math.abs(s.winShare - 100 / 122) < 1e-9); // tested = wins + close + loses
  const newSupplyUsd = 1.3e9 / 40 * 3.5;
  const at10 = s.adoption.find((a) => a.share === 0.1);
  assert.ok(Math.abs(at10.revenueUsd - 10e9 * (9e6 / 30e9)) < 1);
  assert.ok(Math.abs(s.kill.revenue.value - at10.revenueUsd / newSupplyUsd) < 1e-12);
});

test("the $500 test uses the $500 prices and the $500 quote", () => {
  const b = base();
  b.rpw.corridors[0].at500 = { providers: 10, avg: 3, median: 2.5, min: 0.5, digitalAvg: 2 };
  const out = build(b);
  const um = by(out, "USA", "MEX");
  assert.equal(um.at500.benchmark, 2);
  assert.ok(Math.abs(um.at500.nearLo - 0.1) < 1e-9); // $500 quote: 499.5 out of 500
  assert.equal(um.at500.verdict, "wins");
  assert.equal(by(out, "KWT", "PAK").at500, undefined);
  assert.ok(out.summary.at500.winShare > 0);
});
