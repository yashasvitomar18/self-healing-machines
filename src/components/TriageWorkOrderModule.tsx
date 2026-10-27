import { useEffect, useState } from "react";
import {
  ClipboardList,
  Play,
  RefreshCw,
  ShieldAlert,
  Wrench,
} from "lucide-react";
import { api, ApiClientError } from "@/api/client";
import type {
  AnalysisResult,
  TriageDecision,
  WorkOrder,
  WorkOrderStatus,
} from "@/api/types";
import { Card, EmptyState, ErrorBanner, SectionTitle, Spinner } from "./ui";
import {
  PRIORITY_META,
  relativeTime,
  WORK_ORDER_STATUS_META,
  WORK_ORDER_STATUS_ORDER,
} from "@/lib/format";
import { formatRul, formatScore } from "@/lib/format";

export function TriageWorkOrderModule({
  selectedId,
}: {
  selectedId: string | null;
}) {
  const [triage, setTriage] = useState<TriageDecision | null>(null);
  const [triageLoading, setTriageLoading] = useState(false);
  const [triageError, setTriageError] = useState<string | null>(null);

  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Fetch triage for the selected engine.
  useEffect(() => {
    if (!selectedId) {
      setTriage(null);
      return;
    }
    let cancelled = false;
    setTriageLoading(true);
    setTriageError(null);
    api
      .getTriage(selectedId)
      .then((t) => {
        if (!cancelled) setTriage(t);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setTriageError(
            err instanceof ApiClientError ? err.message : String(err)
          );
      })
      .finally(() => {
        if (!cancelled) setTriageLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  // Fetch work orders.
  useEffect(() => {
    let cancelled = false;
    setOrdersLoading(true);
    setOrdersError(null);
    api
      .listWorkOrders()
      .then((o) => {
        if (!cancelled) setOrders(o);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setOrdersError(
            err instanceof ApiClientError ? err.message : String(err)
          );
      })
      .finally(() => {
        if (!cancelled) setOrdersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function runAnalysis() {
    if (!selectedId) return;
    setAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    try {
      const result = await api.analyzeEngine(selectedId);
      setAnalysisResult(result);
      // Refresh triage + work orders so the table reflects the new order.
      setTriage(result.triage);
      const fresh = await api.listWorkOrders();
      setOrders(fresh);
    } catch (err: unknown) {
      setAnalysisError(
        err instanceof ApiClientError ? err.message : String(err)
      );
    } finally {
      setAnalyzing(false);
    }
  }

  async function updateStatus(id: string, status: WorkOrderStatus) {
    setUpdatingId(id);
    try {
      const updated = await api.updateWorkOrderStatus(id, status);
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
    } catch (err: unknown) {
      setOrdersError(
        err instanceof ApiClientError ? err.message : String(err)
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const priorityMeta = triage ? PRIORITY_META[triage.priority] : null;

  return (
    <div className="space-y-6">
      {/* Triage card */}
      <Card className="p-6">
        <SectionTitle
          title="Rule-Based Triage Agent"
          subtitle="Deterministic priority assignment from RUL and anomaly thresholds."
          icon={<ShieldAlert className="h-5 w-5" />}
          right={
            <button
              type="button"
              onClick={runAnalysis}
              disabled={!selectedId || analyzing}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {analyzing ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Run engine analysis
            </button>
          }
        />

        {!selectedId && (
          <EmptyState
            title="No engine selected"
            hint="Pick an engine in the module above to view its triage decision."
            icon={<ShieldAlert className="h-8 w-8" />}
          />
        )}

        {selectedId && triageError && <ErrorBanner message={triageError} />}

        {selectedId && triageLoading && !triage && (
          <div className="flex h-32 items-center justify-center text-slate-500">
            <Spinner className="h-6 w-6" />
          </div>
        )}

        {selectedId && triage && priorityMeta && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${priorityMeta.bg} ${priorityMeta.border} ${priorityMeta.text}`}
              >
                {priorityMeta.label} priority
              </span>
              <span className="text-sm text-slate-400">
                Engine #{triage.engineId}
              </span>
              <span className="text-xs text-slate-500">
                {relativeTime(triage.generatedAt)}
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-slate-800/40 p-4">
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Predicted RUL
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-100">
                  {formatRul(triage.reasoning.predictedRul)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-800/40 p-4">
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Anomaly score
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-100">
                  {formatScore(triage.reasoning.anomalyScore)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-800/40 p-4">
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Status
                </p>
                <p className="mt-1 text-lg font-semibold capitalize text-slate-100">
                  {triage.reasoning.status}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-slate-800/40 p-4">
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Explanation
                </p>
                <p className="mt-1 text-sm text-slate-200 leading-relaxed">
                  {triage.explanation}
                </p>
              </div>
              <div className="rounded-xl bg-slate-800/40 p-4">
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Recommended action
                </p>
                <p className="mt-1 text-sm text-slate-200 leading-relaxed">
                  {triage.recommendedAction}
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Analysis result banner */}
      {analysisError && <ErrorBanner message={analysisError} />}
      {analysisResult && (
        <Card className="p-5 border-cyan-700/40">
          <div className="flex items-start gap-3">
            <Wrench className="mt-0.5 h-5 w-5 text-cyan-400" />
            <div className="text-sm">
              <p className="font-semibold text-slate-100">
                Analysis complete for Engine #{analysisResult.prediction.engineId}
              </p>
              <p className="mt-1 text-slate-300">
                Predicted RUL {formatRul(analysisResult.prediction.predictedRul)} ·{" "}
                Priority{" "}
                <span className={PRIORITY_META[analysisResult.triage.priority].text}>
                  {PRIORITY_META[analysisResult.triage.priority].label}
                </span>
              </p>
              {analysisResult.workOrder ? (
                <p className="mt-1 text-slate-400">
                  Work order {analysisResult.workOrder.id} created — see the table below.
                </p>
              ) : (
                <p className="mt-1 text-slate-400">
                  No work order generated (priority is low; routine monitoring continues).
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Work order table */}
      <Card className="p-6">
        <SectionTitle
          title="Maintenance Work Orders"
          subtitle="Automated work orders generated by the triage agent."
          icon={<ClipboardList className="h-5 w-5" />}
          right={
            <button
              type="button"
              onClick={() => {
                setOrdersLoading(true);
                api
                  .listWorkOrders()
                  .then(setOrders)
                  .catch((err: unknown) =>
                    setOrdersError(
                      err instanceof ApiClientError ? err.message : String(err)
                    )
                  )
                  .finally(() => setOrdersLoading(false));
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          }
        />

        {ordersError && <ErrorBanner message={ordersError} />}

        {ordersLoading && orders.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-slate-500">
            <Spinner className="h-6 w-6" />
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            title="No work orders yet"
            hint="Run engine analysis to generate a maintenance work order."
            icon={<ClipboardList className="h-8 w-8" />}
          />
        ) : (
          <WorkOrderTable
            orders={orders}
            updatingId={updatingId}
            onUpdate={updateStatus}
          />
        )}
      </Card>
    </div>
  );
}

function WorkOrderTable({
  orders,
  updatingId,
  onUpdate,
}: {
  orders: WorkOrder[];
  updatingId: string | null;
  onUpdate: (id: string, status: WorkOrderStatus) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wider text-slate-500">
            <th className="py-2.5 pr-4 font-medium">ID</th>
            <th className="py-2.5 pr-4 font-medium">Engine</th>
            <th className="py-2.5 pr-4 font-medium">Priority</th>
            <th className="py-2.5 pr-4 font-medium">Reason</th>
            <th className="py-2.5 pr-4 font-medium">Created</th>
            <th className="py-2.5 pr-4 font-medium">Status</th>
            <th className="py-2.5 pr-2 text-right font-medium">Update</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/70">
          {orders.map((o) => {
            const pm = PRIORITY_META[o.priority];
            const sm = WORK_ORDER_STATUS_META[o.status];
            return (
              <tr key={o.id} className="align-top hover:bg-slate-800/30">
                <td className="py-3 pr-4 font-mono text-xs text-slate-300">
                  {o.id}
                </td>
                <td className="py-3 pr-4 text-slate-200">#{o.engineId}</td>
                <td className="py-3 pr-4">
                  <span
                    className={`inline-block rounded-md border px-2 py-0.5 text-xs font-medium ${pm.bg} ${pm.border} ${pm.text}`}
                  >
                    {pm.label}
                  </span>
                </td>
                <td className="py-3 pr-4 max-w-xs text-slate-400">
                  {o.reason}
                </td>
                <td className="py-3 pr-4 whitespace-nowrap text-slate-400">
                  {relativeTime(o.createdAt)}
                </td>
                <td className="py-3 pr-4">
                  <span
                    className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${sm.bg} ${sm.text}`}
                  >
                    {sm.label}
                  </span>
                </td>
                <td className="py-3 pr-2 text-right">
                  <select
                    value={o.status}
                    disabled={updatingId === o.id}
                    onChange={(e) =>
                      onUpdate(o.id, e.target.value as WorkOrderStatus)
                    }
                    className={`rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 disabled:opacity-50 ${sm.text}`}
                    aria-label={`Update status for ${o.id}`}
                  >
                    {WORK_ORDER_STATUS_ORDER.map((s) => (
                      <option key={s} value={s}>
                        {WORK_ORDER_STATUS_META[s].label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
