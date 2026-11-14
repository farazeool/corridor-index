// Builds data/thesis.json from the files in data/raw. No network.
import { readFileSync, writeFileSync } from "node:fs";
import { build } from "../lib/model.mjs";

const read = (f) => JSON.parse(readFileSync(new URL(`../data/raw/${f}.json`, import.meta.url)));
const out = build({ rpw: read("rpw"), volumes: read("volumes"), quotes: read("quotes"), p2p: read("p2p"), chain: read("chain"), legality: read("legality") });
writeFileSync(new URL("../data/thesis.json", import.meta.url), JSON.stringify(out, null, 1));
const s = out.summary, B = (x) => `$${(x / 1e9).toFixed(1)}B`;
console.log(`Corridors priced: ${s.corridors}, ${B(s.pricedVolume)} a year`);
for (const [v, x] of Object.entries(s.byVerdict)) console.log(`  ${v.padEnd(9)} ${String(x.corridors).padStart(3)}  ${B(x.volume)}`);
console.log(`NEAR wins ${(s.winShare * 100).toFixed(1)}% of tested volume (kill line ${s.kill.winShare.threshold * 100}%): ${s.kill.winShare.passes ? "PASSES" : "FAILS"}`);
console.log(`Families would keep ${B(s.familiesKeepUsd)} a year if every winning corridor switched`);
console.log(`At 10% adoption, Intents protocol revenue = ${(s.kill.revenue.value * 100).toFixed(1)}% of NEAR's new supply (kill line ${s.kill.revenue.threshold * 100}%): ${s.kill.revenue.passes ? "PASSES" : "FAILS"}`);
console.log(`Today Intents revenue = ${(s.intents.revenue1yUsd / s.near.newSupplyUsd * 100).toFixed(1)}% of new supply ($${(s.near.newSupplyUsd/1e6).toFixed(0)}M a year)`);

// Public copies for the site's download links.
import { mkdirSync } from "node:fs";
mkdirSync(new URL("../public/data/", import.meta.url), { recursive: true });
writeFileSync(new URL("../public/data/thesis.json", import.meta.url), JSON.stringify(out, null, 1));
const name = (c) => out.countries[c]?.name ?? c;
const cols = ["from", "to", "from_name", "to_name", "verdict", "volume_usd_2024", "cost_today_pct", "cost_today_basis", "avg_all_providers_pct", "cheapest_provider_pct", "providers", "near_low_pct", "near_high_pct", "cash_in_pct", "cash_out_pct", "cash_out_premium_pct", "crypto_law", "note"];
const esc = (v) => (v == null ? "" : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
const lines = [cols.join(",")].concat(
  out.corridors.map((c) =>
    [c.from, c.to, name(c.from), name(c.to), c.verdict, c.volume, c.benchmark, c.benchmarkKind, c.avg, c.min, c.providers, c.nearLo, c.nearHi, c.onRamp, c.offRamp, c.offRampPremium, c.law, c.reason].map(esc).join(","),
  ),
);
writeFileSync(new URL("../public/data/corridors.csv", import.meta.url), lines.join("\n") + "\n");

// One line per data run (keyed by when the NEAR Intents quotes were fetched), so the thesis can be followed over time.
import { existsSync } from "node:fs";
const histFile = new URL("../data/history.json", import.meta.url);
const hist = existsSync(histFile) ? JSON.parse(readFileSync(histFile)) : [];
export const historyRow = (t) => ({
  at: t.sources.quotes.at,
  winShare: t.summary.winShare,
  winsCorridors: t.summary.byVerdict.wins.corridors,
  winsVolume: t.summary.byVerdict.wins.volume,
  revenueShare: t.summary.kill.revenue.value,
  winShare500: t.summary.at500?.winShare ?? null,
  intentsLegPct: t.intents.legMedianPct,
  nearPriceUsd: t.summary.near.priceUsd,
});
const row = historyRow(out);
if (!hist.some((h) => h.at === row.at)) hist.push(row);
hist.sort((a, b) => a.at.localeCompare(b.at));
writeFileSync(histFile, JSON.stringify(hist, null, 1));
writeFileSync(new URL("../public/data/history.json", import.meta.url), JSON.stringify(hist, null, 1));
console.log(`History: ${hist.length} runs`);
