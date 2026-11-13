// Live NEAR Intents price for moving US$200 between chains, from the 1Click API.
// dry: true asks for a quote only; no deposit address is created and no money moves.
// Cached for 60 seconds so a busy page doesn't hammer the API.
export const revalidate = 60;

const ROUTES = {
  "base-tron": {
    label: "USDC on Base → USDT on Tron",
    origin: "nep141:base-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.omft.near",
    refundTo: "0x0000000000000000000000000000000000000001",
    destination: "nep141:tron-d28a265909efecdcee7c5028585214ea0b96f015.omft.near",
    recipient: "TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf",
  },
  "sol-bsc": {
    label: "USDC on Solana → USDT on BNB Chain",
    origin: "nep141:sol-5ce3bf3a31af18be40ba30f721101b4341690186.omft.near",
    refundTo: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
    destination: "nep141:bnb-0x55d398326f99059ff775485246999027b3197955.omdep.near",
    recipient: "0x0000000000000000000000000000000000000001",
  },
} as const;

export async function GET(req: Request) {
  const key = (new URL(req.url).searchParams.get("route") ?? "base-tron") as keyof typeof ROUTES;
  const r = ROUTES[key] ?? ROUTES["base-tron"];
  const body = {
    dry: true,
    swapType: "EXACT_INPUT",
    slippageTolerance: 100,
    originAsset: r.origin,
    depositType: "ORIGIN_CHAIN",
    destinationAsset: r.destination,
    amount: "200000000",
    refundTo: r.refundTo,
    refundType: "ORIGIN_CHAIN",
    recipient: r.recipient,
    recipientType: "DESTINATION_CHAIN",
    deadline: new Date(Date.now() + 10 * 60_000).toISOString(),
  };
  try {
    const res = await fetch("https://1click.chaindefuser.com/v0/quote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    const j = await res.json();
    if (!j.quote) return Response.json({ ok: false, error: j.message ?? `HTTP ${res.status}` }, { status: 502 });
    const out = Number(j.quote.amountOutFormatted);
    return Response.json({
      ok: true,
      route: r.label,
      amountIn: 200,
      amountOut: out,
      costPct: ((200 - out) / 200) * 100,
      seconds: j.quote.timeEstimate,
      at: new Date().toISOString(),
      request: { url: "https://1click.chaindefuser.com/v0/quote", body },
    });
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 502 });
  }
}
