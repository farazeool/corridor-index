export const usdB = (x: number) => (x >= 1e9 ? `$${(x / 1e9).toFixed(x >= 1e11 ? 0 : 1)}B` : `$${(x / 1e6).toFixed(0)}M`);
export const usd = (x: number, d = 2) => `$${x.toFixed(d)}`;
export const pct = (x: number | null | undefined, d = 2) => (x == null ? "–" : `${x.toFixed(d)}%`);
export const share = (x: number, d = 0) => `${(x * 100).toFixed(d)}%`;
export const dateUtc = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " UTC";
export const VERDICT_LABEL: Record<string, string> = {
  wins: "NEAR wins",
  close: "Too close",
  loses: "NEAR loses",
  illegal: "Crypto illegal",
  untested: "Can't test",
};
