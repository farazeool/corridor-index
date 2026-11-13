import { VERDICT_LABEL } from "@/lib/format";

const STYLE: Record<string, string> = {
  wins: "bg-wins-wash text-wins border-wins/40",
  close: "bg-close-wash text-close border-close/40",
  loses: "bg-loses-wash text-loses border-loses/40",
  illegal: "bg-law-wash text-law border-law/40",
  untested: "bg-paper-deep text-muted border-rule-strong",
};

export function Pill({ verdict, size = "sm" }: { verdict: string; size?: "sm" | "lg" }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border font-semibold ${STYLE[verdict]} ${
        size === "lg" ? "px-3.5 py-1 text-sm" : "px-2.5 py-0.5 text-xs"
      }`}
    >
      {VERDICT_LABEL[verdict]}
    </span>
  );
}
