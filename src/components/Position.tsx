import { T } from "@/lib/data";
import { pct, share } from "@/lib/format";

// The investment position and the lines that would change it. Lines set on 14 Nov 2026; values recompute every run.
const S = T.summary;
const todayRevShare = S.intents.revenue1yUsd / S.near.newSupplyUsd;
const takeBp = S.intents.revRate * 1e4;
const inrPremium = T.corridors.find((c) => c.recvCur === "INR" && c.offRampPremium != null)?.offRampPremium ?? null;
const LONG_TOKEN_REV_SHARE = 0.15;
const LONG_TOKEN_TAKE_BP = 5;

function Row({ label, now, line, ok }: { label: string; now: string; line: string; ok: boolean }) {
  return (
    <li className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-ink-soft">{label}</span>
      <span className="shrink-0 text-right">
        <span className={`num ${ok ? "text-wins" : "text-ink"}`}>{now}</span>
        <span className="block text-xs text-muted">{line}</span>
      </span>
    </li>
  );
}

export function Position() {
  const tokenLong = todayRevShare >= LONG_TOKEN_REV_SHARE || takeBp >= LONG_TOKEN_TAKE_BP;
  const usageHolds = S.kill.winShare.passes && S.kill.revenue.passes;
  return (
    <div className="card relative overflow-hidden border-blue/50 p-6 sm:p-8 shadow-[0_0_80px_-30px_var(--blue)]">
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,var(--blue-wash),transparent_70%)]" aria-hidden />
      <p className="eyebrow">The position</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div className={`rounded-2xl border p-5 ${usageHolds ? "border-wins/40 bg-wins-wash" : "border-loses/40 bg-loses-wash"}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">NEAR Intents usage</p>
          <p className={`mt-1 font-display text-3xl sm:text-4xl font-bold ${usageHolds ? "text-wins" : "text-loses"}`}>{usageHolds ? "Long" : "Exit"}</p>
          <p className="mt-2 text-sm text-ink-soft">The winning corridors carry about {(S.byVerdict.wins.volume / S.intents.volume1yUsd).toFixed(1)}× what Intents moved in the last year. Cheaper is a real reason to switch.</p>
        </div>
        <div className={`rounded-2xl border p-5 ${tokenLong ? "border-wins/40 bg-wins-wash" : "border-rule-strong bg-[rgb(var(--tint)/0.03)]"}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">The NEAR token</p>
          <p className={`mt-1 font-display text-3xl sm:text-4xl font-bold ${tokenLong ? "text-wins" : "text-blue"}`}>{tokenLong ? "Long" : "Neutral"}</p>
          <p className="mt-2 text-sm text-ink-soft">Most of what users pay goes to solvers and integrators. Usage alone doesn&apos;t yet out-earn the NEAR minted each year.</p>
        </div>
      </div>
      <div className="mt-6 grid gap-x-10 gap-y-4 md:grid-cols-3 text-sm">
        <div>
          <p className="font-semibold text-ink">Turn long the token when</p>
          <ul className="mt-1 divide-y divide-rule">
            <Row label="Intents protocol revenue, share of NEAR's yearly new supply" now={share(todayRevShare, 1)} line={`line: ${share(LONG_TOKEN_REV_SHARE)}`} ok={todayRevShare >= LONG_TOKEN_REV_SHARE} />
            <Row label="or NEAR's cut of each swap, in basis points" now={`${takeBp.toFixed(1)} bp`} line={`line: ${LONG_TOKEN_TAKE_BP} bp`} ok={takeBp >= LONG_TOKEN_TAKE_BP} />
          </ul>
        </div>
        <div>
          <p className="font-semibold text-ink">Exit the usage call when</p>
          <ul className="mt-1 divide-y divide-rule">
            <Row label="NEAR wins less of the tested money than" now={share(S.winShare, 1)} line={`line: ${share(S.kill.winShare.threshold)}`} ok={S.kill.winShare.passes} />
            <Row label="Revenue at 10% adoption covers less new supply than" now={share(S.kill.revenue.value, 1)} line={`line: ${share(S.kill.revenue.threshold)}`} ok={S.kill.revenue.passes} />
          </ul>
        </div>
        <div>
          <p className="font-semibold text-ink">Watch</p>
          <ul className="mt-1 divide-y divide-rule">
            <Row label="Cost of the NEAR Intents leg, $200" now={pct(T.intents.legMedianPct)} line="lower widens every win" ok={false} />
            {inrPremium != null && <Row label="Dollars sell above the official rate in India" now={`+${pct(inrPremium, 0)}`} line="demand, and regulatory risk" ok={false} />}
            <Row label="World Bank prices" now="Q3 2025" line="next quarter re-tests every corridor" ok={false} />
          </ul>
        </div>
      </div>
      <p className="mt-5 text-xs text-muted">Every value above recomputes on each daily run; the lines were set on 14 Nov 2026. Not investment advice.</p>
    </div>
  );
}
