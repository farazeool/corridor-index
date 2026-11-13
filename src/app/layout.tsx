import type { Metadata } from "next";
import "@fontsource/instrument-sans/400.css";
import "@fontsource/instrument-sans/600.css";
import "@fontsource/instrument-sans/700.css";
import "@fontsource/newsreader/400.css";
import "@fontsource/newsreader/400-italic.css";
import "@fontsource/newsreader/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./globals.css";
import { REPO_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Corridor Index: where NEAR wins at sending money home",
  description:
    "A re-runnable investment thesis for NEAR: 348 remittance corridors, World Bank prices, live NEAR Intents quotes and peer-to-peer cash-in and cash-out costs. Where NEAR is cheaper, where it isn't, and whether it matters for the token.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh flex flex-col">
        <div className="stripe" aria-hidden />
        <header className="border-b border-rule">
          <div className="mx-auto max-w-[1120px] px-4 sm:px-6 h-14 flex items-center gap-6">
            <a href="/" className="font-semibold tracking-tight text-[1.05rem] whitespace-nowrap">
              Corridor<span className="text-blue"> Index</span>
            </a>
            <nav className="ml-auto flex gap-4 sm:gap-5 text-sm text-ink-soft whitespace-nowrap">
              <a href="#answer" className="hover:text-ink hidden sm:inline">Answer</a>
              <a href="#corridors" className="hover:text-ink">Corridors</a>
              <a href="#near" className="hover:text-ink">For NEAR</a>
              <a href="#method" className="hover:text-ink hidden sm:inline">Method</a>
              {REPO_URL && <a href={REPO_URL} className="hover:text-ink">Code</a>}
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-rule mt-24">
          <div className="mx-auto max-w-[1120px] px-4 sm:px-6 py-8 text-sm text-muted flex flex-wrap gap-x-6 gap-y-2">
            <span>Corridor Index · an investment thesis built at NEAR HACKATHON. Not investment advice.</span>
            <a className="link" href="/data/thesis.json">All numbers (JSON)</a>
            <a className="link" href="/data/corridors.csv">Corridors (CSV)</a>
            {REPO_URL && <a className="link" href={REPO_URL}>Source and re-run</a>}
          </div>
        </footer>
      </body>
    </html>
  );
}
