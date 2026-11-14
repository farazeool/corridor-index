// Builds src/lib/world.json: one SVG path per country (Natural Earth 1:110m, Equal Earth projection), keyed by ISO3.
import fs from "node:fs";
import { createRequire } from "node:module";
import { feature } from "topojson-client";
import { geoEqualEarth, geoPath } from "d3-geo";
import countries from "i18n-iso-countries";
const require = createRequire(import.meta.url);
const topo = require("world-atlas/countries-110m.json");
const geo = feature(topo, topo.objects.countries);
geo.features = geo.features.filter((f) => f.properties.name !== "Antarctica");
const W = 960, H = 470;
const proj = geoEqualEarth().fitExtent([[4, 4], [W - 4, H - 4]], geo);
const path = geoPath(proj);
const out = { width: W, height: H, countries: [] };
for (const f of geo.features) {
  let iso3 = f.id ? countries.numericToAlpha3(f.id) : null;
  if (!iso3 && f.properties.name === "Kosovo") iso3 = "KSV";
  if (!iso3 && /Somaliland/.test(f.properties.name)) iso3 = "SOM";
  if (!iso3 && /Cyprus/.test(f.properties.name)) iso3 = "CYP";
  const d = path(f);
  if (!d) continue;
  const [cx, cy] = path.centroid(f);
  out.countries.push({ iso3: iso3 ?? null, name: f.properties.name, d: d.replace(/(\.\d)\d+/g, "$1"), cx: Math.round(cx), cy: Math.round(cy) });
}
// Countries too small for 1:110m, drawn as dots.
const SMALL = { BHR: [50.55, 26.07], SGP: [103.82, 1.35], TON: [-175.2, -21.18], WSM: [-172.1, -13.76], COM: [43.3, -11.7], CPV: [-23.6, 15.1] };
out.dots = Object.entries(SMALL).map(([iso3, ll]) => { const [x, y] = proj(ll); return { iso3, cx: Math.round(x), cy: Math.round(y) }; });
fs.writeFileSync("src/lib/world.json", JSON.stringify(out));
console.log(out.countries.length, "countries,", (fs.statSync("src/lib/world.json").size / 1024).toFixed(0), "KB, missing iso:", out.countries.filter((c) => !c.iso3).map((c) => c.name));
