import { T } from "./data";

// "What would change my mind": how far each input has to move before a kill criterion fails.
const S = T.summary;
const K = T.rules.kill;
const tested = T.corridors.filter((c) => c.nearLo != null && c.verdict !== "illegal");
const testedVolume = tested.reduce((a, c) => a + (c.volume ?? 0), 0);

/** Win volume if NEAR's route cost `extra` more points than today's allowance (or incumbents got that much cheaper). */
const winVolume = (extra: number) =>
  tested.reduce((a, c) => a + (c.nearLo! + T.rules.executionBufferPct + extra < c.benchmark ? c.volume ?? 0 : 0), 0);

const revenueShare = (vol: number) => (vol * K.adoptionForFeeTest * S.intents.revRate) / S.near.newSupplyUsd;

function firstFail(test: (extra: number) => boolean) {
  for (let x = 0; x <= 10; x = Math.round((x + 0.05) * 100) / 100) if (!test(x)) return x;
  return null;
}

export const MIND = {
  // Points of extra cost on NEAR's route before each criterion fails.
  winShareFailsAt: firstFail((x) => winVolume(x) / testedVolume >= K.minWinShareOfTestedVolume),
  revenueFailsAt: firstFail((x) => revenueShare(winVolume(x)) >= K.minRevenueShareOfNewSupply),
  // Revenue criterion: how much the protocol's cut can fall, or NEAR's price rise, before it fails.
  takeRateCanFall: 1 - K.minRevenueShareOfNewSupply / S.kill.revenue.value,
  priceFailsAbove: (S.near.priceUsd * S.kill.revenue.value) / K.minRevenueShareOfNewSupply,
  adoptionNeeded: (K.adoptionForFeeTest * K.minRevenueShareOfNewSupply) / S.kill.revenue.value,
};
