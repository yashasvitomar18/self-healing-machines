import { useEffect, useState } from "react";
import { Activity, Cpu, Gauge, Sparkles, TrendingDown } from "lucide-react";
import { api, ApiClientError } from "@/api/client";
import type {
  EngineData,
  EvaluationMetrics,
  RulPrediction,
} from "@/api/types";
import { Card, EmptyState, ErrorBanner, SectionTitle, Spinner } from "./ui";
import { StatCard } from "./StatCard";
import { EngineSelector } from "./EngineSelector";
import {
  DEFAULT_SENSORS,
  SENSOR_OPTIONS,
  SENSOR_LABELS,
} from "./sensorMeta";
import { SensorHistoryChart } from "./SensorHistoryChart";
import { RulScatterChart } from "./RulScatterChart";
import { formatRul, formatScore, STATUS_META } from "@/lib/format";

export function MlEvaluationModule({
  engines,
  selectedId,
  onSelect,
  loadingEngines,
}: {
  engines: EngineData[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loadingEngines: boolean;
}) {
  const [prediction, setPrediction] = useState<RulPrediction | null>(null);
  const [predLoading, setPredLoading] = useState(false);
  const [predError, setPredError] = useState<string | null>(null);

  const [metrics, setMetrics] = useState<EvaluationMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  const [activeSensors, setActiveSensors] = useState<string[]>(DEFAULT_SENSORS);

  const engine = engines.find((e) => e.engineId === selectedId) ?? null;

  // Fetch prediction whenever the selected engine changes.
  useEffect(() => {
    if (!selectedId) {
      setPrediction(null);
      return;
    }
    let cancelled = false;
    setPredLoading(true);
    setPredError(null);
    api
      .getPrediction(selectedId)
      .then((p) => {
        if (!cancelled) setPrediction(p);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setPredError(err instanceof ApiClientError ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setPredLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  // Fetch evaluation metrics once.
  useEffect(() => {
    let cancelled = false;
    setMetricsLoading(true);
    setMetricsError(null);
    api
      .getEvaluationMetrics()
      .then((m) => {
        if (!cancelled) setMetrics(m);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setMetricsError(
            err instanceof ApiClientError ? err.message : String(err)
          );
      })
      .finally(() => {
        if (!cancelled) setMetricsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const statusMeta = engine ? STATUS_META[engine.status] : null;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <SectionTitle
          title="Machine Learning Approach & Model Evaluation"
          subtitle="Remaining-useful-life regression, anomaly detection, and actual-vs-predicted evaluation."
          icon={<Cpu className="h-5 w-5" />}
        />

        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">
              Select engine
            </label>
            <EngineSelector
              engines={engines}
              selectedId={selectedId}
              onSelect={onSelect}
              disabled={loadingEngines}
            />
          </div>
          {engine && statusMeta && (
            <div
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium ring-1 ring-inset ${statusMeta.bg} ${statusMeta.ring} ${statusMeta.text}`}
            >
              <span className={`h-2 w-2 rounded-full ${statusMeta.dot}`} />
              {statusMeta.label}
            </div>
          )}
        </div>
      </Card>

      {/* RUL + anomaly cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Predicted RUL"
          value={formatRul(prediction?.predictedRul)}
          hint="Remaining operating cycles"
          icon={<TrendingDown className="h-4 w-4" />}
          tone={
            prediction
              ? prediction.predictedRul <= 30
                ? "bad"
                : prediction.predictedRul <= 75
                ? "warn"
                : "good"
              : "neutral"
          }
          loading={predLoading}
        />
        <StatCard
          label="Actual RUL"
          value={formatRul(prediction?.actualRul)}
          hint="Ground truth (eval set only)"
          icon={<Gauge className="h-4 w-4" />}
          loading={predLoading}
        />
        <StatCard
          label="Anomaly score"
          value={formatScore(engine?.anomalyScore)}
          hint={engine?.isAnomalous ? "Anomalous window detected" : "Within normal range"}
          icon={<Activity className="h-4 w-4" />}
          tone={
            engine
              ? engine.anomalyScore >= 0.8
                ? "bad"
                : engine.anomalyScore >= 0.5
                ? "warn"
                : "good"
              : "neutral"
          }
        />
        <StatCard
          label="Uncertainty"
          value={prediction?.uncertainty != null ? `± ${prediction.uncertainty} cyc` : "—"}
          hint="Model confidence band"
          icon={<Sparkles className="h-4 w-4" />}
          loading={predLoading}
        />
      </div>

      {predError && <ErrorBanner message={predError} />}

      {/* Sensor history */}
      <Card className="p-6">
        <SectionTitle
          title="Sensor history"
          subtitle="Recent operational sensor telemetry for the selected engine."
          icon={<Activity className="h-5 w-5" />}
          right={
            <SensorToggle
              active={activeSensors}
              onChange={setActiveSensors}
            />
          }
        />
        {!engine && loadingEngines && (
          <div className="flex h-[260px] items-center justify-center text-slate-500">
            <Spinner className="h-6 w-6" />
          </div>
        )}
        {!engine && !loadingEngines && (
          <EmptyState
            title="No engine selected"
            hint="Choose an engine above to view its sensor history."
            icon={<Activity className="h-8 w-8" />}
          />
        )}
        {engine && <SensorHistoryChart engine={engine} selectedSensors={activeSensors} />}
      </Card>

      {/* Evaluation metrics */}
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <StatCard
            label="MAE"
            value={metrics ? metrics.mae.toFixed(1) : "—"}
            hint="Mean absolute error (cycles)"
            tone="neutral"
            loading={metricsLoading}
          />
          <StatCard
            label="RMSE"
            value={metrics ? metrics.rmse.toFixed(1) : "—"}
            hint="Root mean squared error (cycles)"
            tone="neutral"
            loading={metricsLoading}
          />
          <StatCard
            label="R²"
            value={metrics?.r2 != null ? metrics.r2.toFixed(3) : "—"}
            hint={`Evaluated on ${metrics?.sampleCount ?? "—"} engines`}
            tone="good"
            loading={metricsLoading}
          />
        </div>

        <Card className="p-6">
          <SectionTitle
            title="Actual vs Predicted RUL"
            subtitle="Points near the dashed identity line indicate accurate predictions."
            icon={<Gauge className="h-5 w-5" />}
          />
          {metricsError && <ErrorBanner message={metricsError} />}
          {!metricsError && metricsLoading && (
            <div className="flex h-[280px] items-center justify-center text-slate-500">
              <Spinner className="h-6 w-6" />
            </div>
          )}
          {!metricsError && !metricsLoading && metrics && (
            <RulScatterChart metrics={metrics} />
          )}
          {!metricsError && !metricsLoading && !metrics && (
            <EmptyState
              title="No evaluation metrics available"
              hint="Metrics will appear once the backend reports model evaluation results."
              icon={<Gauge className="h-8 w-8" />}
            />
          )}
        </Card>
      </div>
    </div>
  );
}

function SensorToggle({
  active,
  onChange,
}: {
  active: string[];
  onChange: (next: string[]) => void;
}) {
  function toggle(id: string) {
    if (active.includes(id)) {
      if (active.length === 1) return; // keep at least one
      onChange(active.filter((s) => s !== id));
    } else {
      if (active.length >= 4) return; // cap at 4
      onChange([...active, id]);
    }
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {SENSOR_OPTIONS.map((id) => {
        const on = active.includes(id);
        return (
          <button
            key={id}
            type="button"
            onClick={() => toggle(id)}
            className={`rounded-md px-2 py-1 text-[11px] font-medium transition ${
              on
                ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-inset ring-cyan-500/40"
                : "bg-slate-800/60 text-slate-400 hover:text-slate-200"
            }`}
            title={SENSOR_LABELS[id]}
          >
            {id}
          </button>
        );
      })}
    </div>
  );
}
