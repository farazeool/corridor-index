import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { T } from "@/lib/data";

export const alt = "Corridor Index: where NEAR actually wins at sending money home";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const font = (f: string) => readFile(join(process.cwd(), "node_modules/@fontsource", f));

export default async function Image() {
  const S = T.summary;
  const [display, display6, serif] = await Promise.all([
    font("bricolage-grotesque/files/bricolage-grotesque-latin-800-normal.woff"),
    font("bricolage-grotesque/files/bricolage-grotesque-latin-600-normal.woff"),
    font("instrument-serif/files/instrument-serif-latin-400-italic.woff"),
  ]);
  const B = (x: number) => `$${(x / 1e9).toFixed(0)}B`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", background: "radial-gradient(900px 600px at 85% 0%, rgba(184,134,47,0.45), transparent 70%), #0a0b0d", color: "#f2f0ea", fontFamily: "Bricolage" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 22, letterSpacing: 3, textTransform: "uppercase", color: "#b8b7b1" }}>
          <div style={{ width: 12, height: 12, borderRadius: 12, background: "#e8c27a" }} />
          Investment Thesis · NEAR HACKATHON
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "baseline", fontSize: 150, lineHeight: 0.9, letterSpacing: -6 }}>
            Corridor<span style={{ fontFamily: "Instrument", color: "#e8c27a", marginLeft: 28, letterSpacing: -2 }}>Index</span>
          </div>
          <div style={{ marginTop: 26, fontSize: 38, color: "#b8b7b1", fontFamily: "Bricolage6" }}>Where NEAR actually wins at sending money home.</div>
        </div>
        <div style={{ display: "flex", gap: 72, fontFamily: "Bricolage6" }}>
          {[
            [`${Math.round(S.winShare * 100)}%`, "of tested money where NEAR is cheaper", "#3ddc97"],
            [B(S.byVerdict.wins.volume), "a year in corridors NEAR wins", "#f2f0ea"],
            [String(S.corridors), "corridors, World Bank prices", "#f2f0ea"],
          ].map(([v, l, c]) => (
            <div key={l} style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 64, color: c }}>{v}</div>
              <div style={{ fontSize: 22, color: "#7e8089", maxWidth: 300 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Bricolage", data: display, weight: 800 }, { name: "Bricolage6", data: display6, weight: 600 }, { name: "Instrument", data: serif, style: "italic", weight: 400 }] },
  );
}
