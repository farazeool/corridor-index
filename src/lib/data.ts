import thesis from "../../data/thesis.json";

export type Verdict = "wins" | "close" | "loses" | "illegal" | "untested";
export type Corridor = {
  id: string; from: string; to: string; sendCur: string; recvCur: string; volume: number | null;
  providers: number; avg: number; median: number; min: number; digitalAvg: number | null;
  benchmark: number; benchmarkKind: string; onRamp: number | null; offRamp: number | null; offRampPremium: number | null;
  law: "ok" | "banking-ban" | "illegal"; nearLo?: number; nearHi?: number; verdict: Verdict; reason?: string;
  keepPer200?: number; beatsCheapest?: boolean;
};
export type Thesis = Omit<typeof thesis, "corridors"> & { corridors: Corridor[] };
export const T = thesis as unknown as Thesis;
export const country = (c: string) => (T.countries as Record<string, { name: string; region: string }>)[c]?.name ?? c;
