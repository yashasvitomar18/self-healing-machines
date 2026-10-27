import { ChevronDown } from "lucide-react";
import type { EngineData } from "@/api/types";
import { STATUS_META } from "@/lib/format";

export function EngineSelector({
  engines,
  selectedId,
  onSelect,
  disabled,
}: {
  engines: EngineData[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={selectedId ?? ""}
        onChange={(e) => onSelect(e.target.value)}
        disabled={disabled || engines.length === 0}
        className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 pr-10 text-sm font-medium text-slate-100 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 disabled:opacity-50"
        aria-label="Select engine"
      >
        {engines.length === 0 && <option value="">No engines available</option>}
        {engines.map((e) => {
          const m = STATUS_META[e.status];
          return (
            <option key={e.engineId} value={e.engineId}>
              {e.label} — {m.label} · anomaly {e.anomalyScore.toFixed(2)}
            </option>
          );
        })}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
        aria-hidden
      />
    </div>
  );
}
