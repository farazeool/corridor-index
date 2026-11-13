import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy · Corridor Index", description: "What Corridor Index collects: nothing about you." };

export default function Privacy() {
  return (
    <div className="mx-auto max-w-[760px] px-4 sm:px-6 pt-16 sm:pt-24">
      <p className="badge"><i />Privacy</p>
      <h1 className="display mt-5 text-5xl sm:text-6xl font-extrabold leading-[0.95]">We collect nothing about you.</h1>
      <div className="prose-thesis mt-10 space-y-5">
        <p><strong>No accounts, no cookies, no tracking.</strong> Corridor Index has no sign-up, sets no cookies, runs no analytics and shows no ads. There is no wallet to connect.</p>
        <p><strong>What your browser asks for.</strong> The page, its fonts (served from this site, not Google), and its data files. When the page opens, it also asks this site&apos;s own server for a live NEAR Intents price.</p>
        <p><strong>The live NEAR Intents price.</strong> Our server sends a test quote request to the NEAR Intents 1Click API (<code>1click.chaindefuser.com</code>) for moving $200 between two placeholder addresses, with <code>dry: true</code>, so no money moves and nothing about you is included. Your IP address is not passed on.</p>
        <p><strong>Shared links.</strong> Picking a corridor puts it in the address bar (for example <code>?from=ARE&amp;to=IND</code>) so you can share it. &ldquo;Copy link&rdquo; writes that address to your clipboard only when you click it.</p>
        <p><strong>Hosting.</strong> The site runs on Vercel, which keeps standard server logs (such as IP address and the page requested) for security and reliability, under <a className="link" href="https://vercel.com/legal/privacy-policy">Vercel&apos;s privacy policy</a>. We do not read or keep those logs ourselves.</p>
        <p><strong>The data on this site</strong> is about countries and corridors, never about people: World Bank prices, a modelled remittance matrix, public peer-to-peer ads, public blockchain data.</p>
        <p><strong>Questions</strong> can be raised as an issue on the <a className="link" href="https://github.com/farazeool/corridor-index">GitHub repository</a>.</p>
        <p className="text-sm text-muted">Last updated 13 November 2026.</p>
      </div>
    </div>
  );
}
