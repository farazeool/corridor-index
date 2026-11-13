// Pulls every source into data/raw. Each source is fetched on its own: if one fails,
// its previous file is kept and the failure is reported, so a run never leaves the
// thesis half-updated. Then run `npm run thesis` to rebuild data/thesis.json.
import { readFileSync, writeFileSync } from "node:fs";
import XLSX from "xlsx";
import { CURRENCY, RECEIVE_CURRENCIES, SEND_CURRENCIES } from "../lib/currencies.mjs";

const RAW = new URL("../data/raw/", import.meta.url);
const read = (f) => JSON.parse(readFileSync(new URL(`${f}.json`, RAW)));
const write = (f, data) => writeFileSync(new URL(`${f}.json`, RAW), JSON.stringify(data, null, 1));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const median = (xs) => {
  const s = xs.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!s.length) return null;
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const r2 = (x) => Math.round(x * 100) / 100;

async function getJson(url, init) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.json();
}
async function getBuffer(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(300_000) });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}

// 1. World Bank Remittance Prices Worldwide: average, median, cheapest and online cost per corridor.
const RPW_FILE = "https://datacatalogfiles.worldbank.org/ddh-published/0037898/DR0095523/rpw_dataset_2011_2025_q3.xlsx";
async function prices() {
  const wb = XLSX.read(await getBuffer(RPW_FILE), { type: "array", dense: true });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets["Dataset (from Q2 2016)"], { header: 1, defval: null });
  const h = rows[0];
  const col = (name) => h.indexOf(name);
  const [P, S, SN, D, DN, DR, AP, COST, COST500] = ["period", "source_code", "source_name", "destination_code", "destination_name", "destination_region", "access point", "cc1 total cost %", "cc2 total cost %"].map(col);
  // cc1 = sending the equivalent of US$200, cc2 = US$500.
  const stats = (g, C) => {
    const rows = g.filter((r) => typeof r[C] === "number");
    if (!rows.length) return null;
    const v = rows.map((r) => r[C]);
    const dig = rows.filter((r) => /Internet|Mobile/.test(r[AP])).map((r) => r[C]);
    return { providers: v.length, avg: r2(v.reduce((a, b) => a + b, 0) / v.length), median: r2(median(v)), min: r2(Math.min(...v)), digitalAvg: dig.length ? r2(dig.reduce((a, b) => a + b, 0) / dig.length) : null };
  };
  const body = rows.slice(1).filter((r) => typeof r[COST] === "number");
  const period = [...new Set(body.map((r) => r[P]))].sort().at(-1);
  const latest = body.filter((r) => r[P] === period);
  const groups = new Map();
  for (const r of latest) {
    const k = r[S] + r[D];
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  }
  const prev = read("rpw");
  const countries = { ...prev.countries };
  const corridors = [...groups.values()].map((g) => {
    const v = g.map((r) => r[COST]);
    const dig = g.filter((r) => /Internet|Mobile/.test(r[AP])).map((r) => r[COST]);
    countries[g[0][S]] ??= { name: g[0][SN], region: "" };
    countries[g[0][D]] ??= { name: g[0][DN], region: g[0][DR] };
    return {
      from: g[0][S], to: g[0][D], providers: v.length,
      avg: r2(v.reduce((a, b) => a + b, 0) / v.length), median: r2(median(v)), min: r2(Math.min(...v)),
      digitalAvg: dig.length ? r2(dig.reduce((a, b) => a + b, 0) / dig.length) : null,
      at500: stats(g, COST500),
    };
  });
  const globalAverage = r2(latest.reduce((a, r) => a + r[COST], 0) / latest.length);
  write("rpw", { ...prev, file: RPW_FILE, period, globalAverage, countries, corridors });
  return `${corridors.length} corridors, ${period}`;
}

// 2. CGD 2024 bilateral remittances matrix: how much each corridor carries.
const CGD_FILE = "https://www.cgdev.org/sites/default/files/CGD-updated-2024-bilateral-remittances-matrix-%20XLSX.xlsx";
async function volumes() {
  const wb = XLSX.read(await getBuffer(CGD_FILE), { type: "array" });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets.Matrix, { header: 1, defval: null });
  const h = rows[0];
  const [Y, REC, SRC, USD] = ["Year", "Recipient WB A3", "Source WB A3", "Bilateral remittances (current US$)"].map((c) => h.indexOf(c));
  const flows = new Map();
  let world = 0;
  for (const r of rows.slice(1)) {
    if (r[Y] !== 2024) continue;
    world += r[USD] || 0;
    flows.set(r[SRC] + r[REC], r[USD]);
  }
  const wbCode = (c) => (c === "KSV" ? "XKX" : c); // Kosovo
  const corridors = {};
  for (const c of read("rpw").corridors) {
    const v = flows.get(wbCode(c.from) + wbCode(c.to));
    corridors[c.from + c.to] = v == null ? null : Math.round(v / 1e6) * 1e6;
  }
  write("volumes", { ...read("volumes"), file: CGD_FILE, worldTotalUsd: Math.round(world / 1e9) * 1e9, corridors });
  return `${Object.keys(corridors).length} corridors, world total $${Math.round(world / 1e9)}B`;
}

// 3. NEAR Intents 1Click dry-run quotes for US$200 and US$500 on common stablecoin routes.
const ASSETS = {
  "USDC@eth": ["nep141:eth-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.omft.near", "0x0000000000000000000000000000000000000001"],
  "USDC@base": ["nep141:base-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.omft.near", "0x0000000000000000000000000000000000000001"],
  "USDC@arb": ["nep141:arb-0xaf88d065e77c8cc2239327c5edb3a432268e5831.omft.near", "0x0000000000000000000000000000000000000001"],
  "USDC@sol": ["nep141:sol-5ce3bf3a31af18be40ba30f721101b4341690186.omft.near", "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"],
  "USDC@pol": ["nep141:pol-0x3c499c542cef5e3811e1192ce70d8cc03d5c3359.omdep.near", "0x0000000000000000000000000000000000000001"],
  "USDT@eth": ["nep141:eth-0xdac17f958d2ee523a2206206994597c13d831ec7.omft.near", "0x0000000000000000000000000000000000000001"],
  "USDT@tron": ["nep141:tron-d28a265909efecdcee7c5028585214ea0b96f015.omft.near", "TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf"],
  "USDT@bsc": ["nep141:bnb-0x55d398326f99059ff775485246999027b3197955.omdep.near", "0x0000000000000000000000000000000000000001"],
};
const ROUTES = [
  ["USDC@base", "USDT@tron"], ["USDC@eth", "USDT@tron"], ["USDC@arb", "USDT@tron"], ["USDC@sol", "USDT@tron"],
  ["USDC@base", "USDT@bsc"], ["USDC@sol", "USDT@bsc"], ["USDT@tron", "USDT@bsc"], ["USDC@base", "USDC@sol"],
  ["USDT@tron", "USDC@sol"], ["USDC@pol", "USDT@tron"], ["USDT@eth", "USDT@tron"],
];
async function quotes() {
  const rows = [];
  for (const [from, to] of ROUTES) {
    for (const amount of [200, 500]) {
      const body = {
        dry: true, swapType: "EXACT_INPUT", slippageTolerance: 100,
        originAsset: ASSETS[from][0], depositType: "ORIGIN_CHAIN", destinationAsset: ASSETS[to][0],
        amount: String(amount * 1e6), refundTo: ASSETS[from][1], refundType: "ORIGIN_CHAIN",
        recipient: ASSETS[to][1], recipientType: "DESTINATION_CHAIN", deadline: new Date(Date.now() + 600_000).toISOString(),
      };
      try {
        const j = await getJson("https://1click.chaindefuser.com/v0/quote", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
        if (j.quote) rows.push({ from, to, amountIn: amount, amountOut: Number(j.quote.amountOutFormatted), seconds: j.quote.timeEstimate });
      } catch { /* a route without liquidity is skipped */ }
    }
  }
  if (rows.length < 6) throw new Error(`only ${rows.length} quotes came back`);
  write("quotes", { ...read("quotes"), at: new Date().toISOString(), rows });
  return `${rows.length} quotes`;
}

// 4. Cash in and cash out: Binance P2P USDT ads vs the mid-market rate.
async function p2p() {
  const ad = async (fiat, tradeType) => {
    const j = await getJson("https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ fiat, page: 1, rows: 10, tradeType, asset: "USDT", countries: [], proMerchantAds: false, shieldMerchantAds: false, publisherType: null, payTypes: [], classifies: ["mass", "profession"] }),
    });
    return median((j.data ?? []).slice(0, 5).map((a) => Number(a.adv.price)));
  };
  const needed = new Set(read("rpw").corridors.flatMap((c) => [CURRENCY[c.from], CURRENCY[c.to]]));
  const buy = {}, sell = {}, missing = [];
  for (const f of SEND_CURRENCIES.filter((c) => needed.has(c))) { buy[f] = await ad(f, "BUY"); if (buy[f] == null) { delete buy[f]; missing.push(f); } await sleep(300); }
  for (const f of [...new Set(RECEIVE_CURRENCIES)].filter((c) => needed.has(c))) { sell[f] = await ad(f, "SELL"); if (sell[f] == null) { delete sell[f]; missing.push(f); } await sleep(300); }
  if (Object.keys(buy).length < 3 || Object.keys(sell).length < 5) throw new Error("Binance P2P returned too few markets (it blocks some regions)");
  const fx = await getJson("https://open.er-api.com/v6/latest/USD");
  const mid = Object.fromEntries([...new Set([...Object.keys(buy), ...Object.keys(sell)])].map((c) => [c, fx.rates[c]]));
  write("p2p", { ...read("p2p"), at: new Date().toISOString(), buy, sell, missing: [...new Set(missing)], midAt: new Date(fx.time_last_update_unix * 1000).toISOString(), mid });
  return `${Object.keys(buy).length} cash-in and ${Object.keys(sell).length} cash-out markets`;
}

// 5. NEAR Intents volume, fees and revenue (DefiLlama); NEAR supply and inflation (RPC); NEAR price.
async function chain() {
  const fees = await getJson("https://api.llama.fi/summary/fees/near-intents?dataType=dailyFees");
  const rev = await getJson("https://api.llama.fi/summary/fees/near-intents?dataType=dailyRevenue");
  const vol = await getJson("https://api.llama.fi/summary/dexs/near-intents?dataType=dailyVolume");
  const price = await getJson("https://coins.llama.fi/prices/current/coingecko:near");
  const rpc = (method, params) => getJson("https://rpc.mainnet.fastnear.com", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
  const block = (await rpc("block", { finality: "final" })).result.header;
  const config = (await rpc("EXPERIMENTAL_protocol_config", { finality: "final" })).result;
  const prev = read("chain");
  write("chain", {
    ...prev,
    fetchedAt: new Date().toISOString(),
    defillama: { ...prev.defillama, volumeUsd: { d24: vol.total24h, d30: vol.total30d, y1: vol.total1y }, feesUsd: { d24: fees.total24h, d30: fees.total30d, y1: fees.total1y }, revenueUsd: { d30: rev.total30d, y1: rev.total1y } },
    nearPriceUsd: { ...prev.nearPriceUsd, price: price.coins["coingecko:near"].price },
    nearRpc: { ...prev.nearRpc, height: block.height, totalSupplyNear: Number(BigInt(block.total_supply) / 10n ** 21n) / 1e3, maxInflationRate: config.max_inflation_rate, protocolVersion: config.protocol_version },
  });
  return `Intents 1y volume $${(vol.total1y / 1e9).toFixed(1)}B, NEAR $${price.coins["coingecko:near"].price.toFixed(2)}`;
}

const only = process.argv.slice(2);
const jobs = { prices, volumes, quotes, p2p, chain };
let failed = 0;
for (const [name, job] of Object.entries(jobs)) {
  if (only.length && !only.includes(name)) continue;
  try {
    console.log(`✓ ${name}: ${await job()}`);
  } catch (e) {
    failed++;
    console.log(`✗ ${name}: ${e.message} (kept the previous data/raw file)`);
  }
}
console.log(failed ? `${failed} source(s) kept their previous snapshot.` : "All sources refreshed.");
console.log("Now run: npm run thesis");
