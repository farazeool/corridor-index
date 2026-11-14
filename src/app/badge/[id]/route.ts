import { T, country } from "@/lib/data";
import { VERDICT_LABEL } from "@/lib/format";

// A small SVG badge with one corridor's verdict, for READMEs, blogs and dashboards.
export const dynamic = "force-static";
export function generateStaticParams() {
  return T.corridors.map((c) => ({ id: `${c.id}.svg` }));
}
const COLOR: Record<string, string> = { wins: "#1f9e6a", close: "#c46d1b", loses: "#c9443a", illegal: "#7a5fd1", untested: "#5c5f66" };
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id.replace(/\.svg$/, "");
  const c = T.corridors.find((x) => x.id === id);
  if (!c) return new Response("Not found", { status: 404 });
  const left = `${country(c.from)} → ${country(c.to)}`;
  const right = VERDICT_LABEL[c.verdict] + (c.verdict === "wins" && c.keepPer200 ? ` · +$${c.keepPer200.toFixed(2)}/$200` : "");
  const w = (s: string) => Math.round(s.length * 6.6 + 20);
  const lw = Math.round(left.length * 6.1 + 30), rw = w(right);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${lw + rw}" height="22" role="img" aria-label="${esc(left)}: ${esc(right)}">
<title>${esc(left)}: ${esc(right)} (Corridor Index)</title>
<clipPath id="r"><rect width="${lw + rw}" height="22" rx="4"/></clipPath>
<g clip-path="url(#r)"><rect width="${lw}" height="22" fill="#17181c"/><rect x="${lw}" width="${rw}" height="22" fill="${COLOR[c.verdict]}"/></g>
<circle cx="11" cy="11" r="4" fill="#e8c27a"/>
<g fill="#fff" font-family="Verdana,DejaVu Sans,sans-serif" font-size="11"><text x="${lw / 2 + 8}" y="15" text-anchor="middle">${esc(left)}</text><text x="${lw + rw / 2}" y="15" text-anchor="middle" font-weight="bold">${esc(right)}</text></g>
</svg>`;
  return new Response(svg, { headers: { "content-type": "image/svg+xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
