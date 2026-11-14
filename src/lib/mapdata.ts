import { T, country } from "./data";
import type { MapStat } from "@/components/WorldMap";

function by(dir: "to" | "from") {
  const out: Record<string, MapStat> = {};
  for (const c of T.corridors) {
    if (!c.volume) continue;
    const k = dir === "to" ? c.to : c.from;
    const s = (out[k] ??= { name: country(k), volume: 0, wins: 0, close: 0, loses: 0, illegal: 0, untested: 0, corridors: [] });
    s.volume += c.volume;
    s[c.verdict] += c.volume;
    s.corridors.push({ id: c.id, other: country(dir === "to" ? c.from : c.to), verdict: c.verdict, volume: c.volume });
  }
  for (const s of Object.values(out)) s.corridors.sort((a, b) => b.volume - a.volume);
  return out;
}
export const MAP = { to: by("to"), from: by("from") };
