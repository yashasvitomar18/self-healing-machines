import type { ReactNode } from "react";
import { Card, Spinner } from "./ui";

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "neutral",
  loading,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad";
  loading?: boolean;
}) {
  const toneText =
    tone === "good"
      ? "text-emerald-300"
      : tone === "warn"
      ? "text-amber-300"
      : tone === "bad"
      ? "text-rose-300"
      : "text-slate-100";
  const toneRing =
    tone === "good"
      ? "ring-emerald-500/20"
      : tone === "warn"
      ? "ring-amber-500/20"
      : tone === "bad"
      ? "ring-rose-500/20"
      : "ring-slate-700/40";
  return (
    <Card className={`p-5 ring-1 ${toneRing}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
          {label}
        </p>
        {icon && <div className="text-slate-500">{icon}</div>}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        {loading ? (
          <Spinner className="h-6 w-6 text-slate-500" />
        ) : (
          <p className={`text-3xl font-semibold tabular-nums ${toneText}`}>
            {value}
          </p>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </Card>
  );
}
