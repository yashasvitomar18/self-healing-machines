import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Activity, ClipboardList, Cpu, Radar, RefreshCw } from "lucide-react";
import { api, ApiClientError } from "@/api/client";
import { DATA_SOURCE_LABEL, USE_MOCK } from "@/api/config";
import type { EngineData, WorkOrder } from "@/api/types";
import { Card, ErrorBanner, Spinner } from "@/components/ui";
import { StatCard } from "@/components/StatCard";
import { MlEvaluationModule } from "@/components/MlEvaluationModule";
import { TriageWorkOrderModule } from "@/components/TriageWorkOrderModule";

type Tab = "ml" | "triage";

export default function App() {
  const [engines, setEngines] = useState<EngineData[]>([]);
  const [enginesLoading, setEnginesLoading] = useState(true);
  const [enginesError, setEnginesError] = useState<string | null>(null);

  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("ml");

  // Load engine list on mount.
  useEffect(() => {
    let cancelled = false;
    setEnginesLoading(true);
    setEnginesError(null);
    api
      .listEngines()
      .then((list) => {
        if (cancelled) return;
        setEngines(list);
        // Default to the first critical engine, else the first engine.
        const firstCritical = list.find((e) => e.status === "critical");
        setSelectedId((firstCritical ?? list[0])?.engineId ?? null);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setEnginesError(
            err instanceof ApiClientError ? err.message : String(err)
          );
      })
      .finally(() => {
        if (!cancelled) setEnginesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Keep a lightweight work-order count for the overview cards.
  useEffect(() => {
    let cancelled = false;
    api
      .listWorkOrders()
      .then((o) => {
        if (!cancelled) setOrders(o);
      })
      .catch(() => {
        /* surfaced in the triage module */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const overview = useMemo(() => {
    const monitored = engines.length;
    const anomalous = engines.filter((e) => e.isAnomalous).length;
    const highPriority = engines.filter(
      (e) => e.status === "critical" || e.status === "warning"
    ).length;
    const openOrders = orders.filter(
      (o) => o.status === "open" || o.status === "assigned" || o.status === "in_progress"
    ).length;
    return { monitored, anomalous, highPriority, openOrders };
  }, [engines, orders]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/15 ring-1 ring-cyan-500/30">
              <Radar className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-100 leading-tight">
                Self-Healing Machines
              </h1>
              <p className="text-[11px] text-slate-500 leading-tight">
                Predictive Maintenance · Connected Fleet
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`hidden items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset sm:inline-flex ${
                USE_MOCK
                  ? "bg-amber-500/10 text-amber-300 ring-amber-500/30"
                  : "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30"
              }`}
              title={DATA_SOURCE_LABEL}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  USE_MOCK ? "bg-amber-400" : "bg-emerald-400"
                }`}
              />
              {DATA_SOURCE_LABEL}
            </span>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Overview cards */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Monitored engines"
            value={overview.monitored}
            hint="Connected fleet units"
            icon={<Cpu className="h-4 w-4" />}
            loading={enginesLoading}
          />
          <StatCard
            label="Anomalous engines"
            value={overview.anomalous}
            hint="Flagged by anomaly detector"
            icon={<Activity className="h-4 w-4" />}
            tone={overview.anomalous > 0 ? "warn" : "good"}
            loading={enginesLoading}
          />
          <StatCard
            label="High-priority alerts"
            value={overview.highPriority}
            hint="Warning + critical status"
            icon={<AlertTriangle className="h-4 w-4" />}
            tone={overview.highPriority > 0 ? "bad" : "good"}
            loading={enginesLoading}
          />
          <StatCard
            label="Open work orders"
            value={overview.openOrders}
            hint="Open, assigned, or in progress"
            icon={<ClipboardList className="h-4 w-4" />}
            tone={overview.openOrders > 0 ? "warn" : "good"}
          />
        </section>

        {enginesError && (
          <div className="mt-6">
            <ErrorBanner message={enginesError} />
          </div>
        )}

        {/* Tabs */}
        <div className="mt-8 mb-5 flex gap-1 rounded-xl border border-slate-800 bg-slate-900/60 p-1">
          <TabButton
            active={tab === "ml"}
            onClick={() => setTab("ml")}
            icon={<Cpu className="h-4 w-4" />}
            label="ML Approach & Evaluation"
          />
          <TabButton
            active={tab === "triage"}
            onClick={() => setTab("triage")}
            icon={<ClipboardList className="h-4 w-4" />}
            label="Triage & Work Orders"
          />
        </div>

        {enginesLoading && engines.length === 0 ? (
          <Card className="flex h-64 items-center justify-center">
            <Spinner className="h-8 w-8 text-slate-500" />
          </Card>
        ) : (
          <>
            {tab === "ml" && (
              <MlEvaluationModule
                engines={engines}
                selectedId={selectedId}
                onSelect={setSelectedId}
                loadingEngines={enginesLoading}
              />
            )}
            {tab === "triage" && (
              <TriageWorkOrderModule selectedId={selectedId} />
            )}
          </>
        )}

        <footer className="mt-10 border-t border-slate-800 pt-4 text-center text-xs text-slate-600">
          Tata Elxsi TELIPORT Season 4 · Self-Healing Machines ·{" "}
          {USE_MOCK
            ? "UI preview with labeled mock data"
            : "Connected to live FastAPI backend"}
        </footer>
      </main>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
        active
          ? "bg-slate-800 text-slate-100 shadow-sm"
          : "text-slate-400 hover:text-slate-200"
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{label.split(" ")[0]}</span>
    </button>
  );
}
