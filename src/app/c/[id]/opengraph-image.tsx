import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { T, country } from "@/lib/data";
import { VERDICT_LABEL } from "@/lib/format";

export const alt = "Corridor Index: one remittance corridor, today's cost against NEAR Intents";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export function generateStaticParams() {
  return T.corridors.map((c) => ({ id: c.id }));
}

const font = (f: string) => readFile(join(process.cwd(), "node_modules/@fontsource", f));
const COLOR: Record<string, string> = { wins: "#3ddc97", close: "#ff9f43", loses: "#ff6b5e", illegal: "#b49cff", untested: "#9a9ca3" };

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = T.corridors.find((x) => x.id === id)!;
  const [display, display6, serif] = await Promise.all([
    font("bricolage-grotesque/files/bricolage-grotesque-latin-800-normal.woff"),
    font("bricolage-grotesque/files/bricolage-grotesque-latin-600-normal.woff"),
    font("instrument-serif/files/instrument-serif-latin-400-italic.woff"),
  ]);
  const len = (country(c.from) + country(c.to)).length;
  const tested = c.nearLo != null && c.verdict !== "illegal";
  const col = COLOR[c.verdict];
  const p = (x: number) => `${x.toFixed(2)}%`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "60px 72px", background: `radial-gradient(900px 600px at 90% 0%, ${col}33, transparent 70%), #0a0b0d`, color: "#f2f0ea", fontFamily: "Bricolage6" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 24, color: "#b8b7b1" }}>
          <span style={{ fontFamily: "Bricolage" }}>Corridor</span><span style={{ fontFamily: "Instrument", color: "#e8c27a", fontSize: 30 }}>Index</span>
          <span style={{ marginLeft: 12, letterSpacing: 2, fontSize: 18, textTransform: "uppercase" }}>· sending $200 home</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontFamily: "Bricolage", fontSize: len > 30 ? 52 : len > 18 ? 68 : 96, flexWrap: "wrap", lineHeight: 1, letterSpacing: -3 }}>
            {country(c.from)} <span style={{ fontFamily: "Instrument", color: "#e8c27a", margin: "0 24px", letterSpacing: 0 }}>to</span> {country(c.to)}
          </div>
          <div style={{ display: "flex", marginTop: 28 }}>
            <div style={{ display: "flex", fontSize: 36, color: col, border: `3px solid ${col}`, borderRadius: 999, padding: "6px 26px" }}>{VERDICT_LABEL[c.verdict]}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 80 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 22, color: "#7e8089" }}>Providers today</div>
            <div style={{ fontSize: 60 }}>{p(c.benchmark)}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 22, color: "#7e8089" }}>Through NEAR Intents</div>
            <div style={{ fontSize: 60, color: tested ? col : "#7e8089" }}>{tested ? `${p(c.nearLo!)}–${p(c.nearHi!)}` : "—"}</div>
          </div>
          {c.verdict === "wins" && c.keepPer200 != null && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 22, color: "#7e8089" }}>Family keeps</div>
              <div style={{ fontSize: 60, color: col }}>{`+$${c.keepPer200.toFixed(2)}`}</div>
            </div>
          )}
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Bricolage", data: display, weight: 800 }, { name: "Bricolage6", data: display6, weight: 600 }, { name: "Instrument", data: serif, style: "italic", weight: 400 }] },
  );
}
