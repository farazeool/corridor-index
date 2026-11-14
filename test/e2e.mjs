// End-to-end checks of the built site: every route, every control, mobile layout, no page errors.
// Run the site (npm run build && npm start), then: BASE=http://localhost:3000 npm run e2e
// Needs Playwright: npm i --no-save playwright && npx playwright install chromium
import { chromium, devices } from "playwright";
const S = process.env.BASE ?? "http://localhost:3000";
const results = []; const ok = (name, cond, info = "") => { results.push([cond ? "PASS" : "FAIL", name, info]); };
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1366, height: 860 } });
await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: S });
const p = await ctx.newPage();
const errors = []; p.on("pageerror", (e) => errors.push(e.message)); p.on("console", (m) => m.type() === "error" && !/api\/quote|Failed to load resource/.test(m.text()) && errors.push(m.text()));

// Routes
for (const r of ["/", "/about", "/privacy", "/c/areind", "/c/kwtpak", "/c/saubgd", "/badge/areind.svg", "/c/areind/opengraph-image", "/opengraph-image", "/data/thesis.json", "/data/corridors.csv", "/data/history.json", "/icon.svg"]) {
  const res = await p.request.get(S + r); ok(`GET ${r}`, res.status() === 200, `${res.status()} ${res.headers()["content-type"]}`);
}
ok("404 for unknown corridor", (await p.request.get(S + "/c/zzzzzz")).status() === 404);
const csv = await (await p.request.get(S + "/data/corridors.csv")).text(); ok("CSV has 348 rows", csv.trim().split("\n").length === 349, csv.trim().split("\n").length - 1);

// Home
await p.goto(S + "/", { waitUntil: "networkidle" });
ok("Hero title", (await p.locator("h1").first().innerText()).includes("Corridor"));
await p.waitForTimeout(2500);
const stat = await p.locator("text=/^\\d+%$/").first().innerText().catch(() => ""); ok("Count-up reaches %", /\d+%/.test(stat), stat);
// Calculator
await p.locator("#calculator").scrollIntoViewIfNeeded();
ok("Default corridor Kuwait→Pakistan loses", await p.locator("#calculator").getByText("NEAR loses").first().isVisible());
await p.getByRole("button", { name: "UAE → India" }).click(); await p.waitForTimeout(300);
ok("UAE→India wins", await p.locator("#calculator").getByText("NEAR wins").first().isVisible());
ok("URL synced", p.url().includes("from=ARE") && p.url().includes("to=IND"), p.url());
await p.getByRole("button", { name: "$500", exact: true }).click(); await p.waitForTimeout(200);
ok("$500 switch", (await p.locator("#calculator").innerText()).toLowerCase().includes("send $500 from"));
await p.getByRole("button", { name: "$200", exact: true }).click();
await p.locator("#calculator select").first().selectOption("USA"); await p.waitForTimeout(200);
ok("Sender select changes receivers", (await p.locator("#calculator select").nth(1).locator("option").count()) > 3);
await p.getByRole("button", { name: "Share this corridor" }).click(); await p.waitForTimeout(300);
const clip = await p.evaluate(() => navigator.clipboard.readText()); ok("Share copies /c/ link", /\/c\/usa[a-z]{3}$/.test(clip), clip);
// Kill criteria + mind
ok("Kill criteria pass", (await p.locator("#answer aside").getByText("Passes").count()) === 2);
ok("What would change my mind", await p.getByText("What would change my mind").isVisible());
ok("History charts", (await p.locator(".history").count()) === 2);
// Map
await p.locator("#map").scrollIntoViewIfNeeded(); await p.waitForTimeout(800);
const india = p.locator("#map svg path").filter({ has: p.locator('title:text-is("India")') });
await india.click(); await p.waitForTimeout(300);
ok("Map click India", (await p.locator("#map aside").innerText()).includes("India"));
await india.hover(); await p.waitForTimeout(200);
ok("Map tooltip", await p.locator("#map .pointer-events-none.absolute").isVisible());
await p.getByRole("button", { name: "Money sent from" }).click();
await p.locator("#map svg path").filter({ has: p.locator('title:text-is("Saudi Arabia")') }).click(); await p.waitForTimeout(300);
ok("Map sent-from Saudi Arabia", (await p.locator("#map aside").innerText()).includes("Saudi Arabia"));
const href = await p.locator("#map aside li a").first().getAttribute("href"); ok("Map rows link to /c/", /^\/c\//.test(href), href);
// Table
await p.locator("#corridors").scrollIntoViewIfNeeded();
const before = await p.locator("#corridors").innerText();
await p.locator("#corridors input[type=range]").fill("3"); await p.waitForTimeout(300);
const after = await p.locator("#corridors").innerText(); ok("Stress slider changes result", before !== after);
await p.getByRole("button", { name: "Crypto illegal" }).click(); await p.waitForTimeout(200);
ok("Illegal tab lists corridors", (await p.locator("#corridors tbody tr").count()) > 10, await p.locator("#corridors tbody tr").count());
await p.locator("#corridors input[type=search], #corridors input[placeholder*=Search]").first().fill("Bangladesh"); await p.waitForTimeout(200);
ok("Search filters", (await p.locator("#corridors tbody tr").count()) > 0);
// Theme
await p.locator(".theme-btn").click(); await p.waitForTimeout(900);
ok("Theme → light", (await p.evaluate(() => document.documentElement.dataset.theme)) === "light");
await p.reload(); await p.waitForTimeout(500);
ok("Theme persists", (await p.evaluate(() => document.documentElement.dataset.theme)) === "light");
await p.locator(".theme-btn").click(); await p.waitForTimeout(900);
ok("Theme → dark", (await p.evaluate(() => document.documentElement.dataset.theme)) === "dark");
// Shared link opens the corridor
await p.goto(S + "/?from=SAU&to=IND#calculator"); await p.waitForTimeout(500);
ok("Shared ?from&to opens corridor", (await p.locator("#calculator select").first().inputValue()) === "SAU");
// Corridor page + embed
await p.goto(S + "/c/areind"); await p.waitForTimeout(400);
ok("Corridor page title", (await p.title()).includes("United Arab Emirates"));
ok("OG image meta", !!(await p.locator('meta[property="og:image"]').getAttribute("content")));
await p.getByRole("button", { name: "Copy Markdown" }).click(); await p.waitForTimeout(200);
ok("Embed copies markdown", (await p.evaluate(() => navigator.clipboard.readText())).includes("/badge/areind.svg"));
await p.getByRole("link", { name: "Open in the calculator" }).click(); await p.waitForTimeout(800);
ok("Open in calculator", p.url().includes("from=ARE"));
// About
await p.goto(S + "/about"); await p.waitForTimeout(800);
const nearCard = p.locator("#near input[type=range]");
ok("About adoption slider exists", (await nearCard.count()) > 0);
if (await nearCard.count()) { const t1 = await p.locator("#near").innerText(); await nearCard.first().fill("0.25"); await p.waitForTimeout(200); ok("Adoption slider changes numbers", t1 !== (await p.locator("#near").innerText())); }
// Links on home
await p.goto(S + "/"); const links = await p.$$eval("a[href^='/']", (as) => [...new Set(as.map((a) => a.getAttribute("href").split("#")[0]))]);
for (const l of links) { const r = await p.request.get(S + (l || "/")); if (r.status() !== 200) ok(`internal link ${l}`, false, r.status()); }
ok(`internal links (${links.length})`, true);
// Mobile
const m = await b.newContext({ ...devices["iPhone 13"] }); const mp = await m.newPage();
for (const r of ["/", "/about", "/c/areind"]) {
  await mp.goto(S + r, { waitUntil: "networkidle" }); await mp.waitForTimeout(600);
  const ov = await mp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); ok(`Mobile no sideways scroll ${r}`, ov <= 1, ov);
}
ok("No page errors", errors.length === 0, errors.slice(0, 3).join(" | "));
await b.close();
for (const r of results) console.log(r.join("  "));
const failed = results.filter((r) => r[0] === "FAIL").length;
console.log(failed, "failures of", results.length);
process.exit(failed ? 1 : 0);
