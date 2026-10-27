import {
  CartesianGrid,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ComposedChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EvaluationMetrics } from "@/api/types";

/**
 * Actual-vs-predicted RUL chart. Points should hug the y=x reference line when
 * the model is accurate. The dashed line is the ideal identity line.
 */
export function RulScatterChart({ metrics }: { metrics: EvaluationMetrics }) {
  const data = metrics.points.map((p) => ({
    engine: p.engineId,
    actual: p.actualRul,
    predicted: p.predictedRul,
  }));
  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.actual, d.predicted)),
    1
  );
  const lineData = [
    { ideal: 0 },
    { ideal: Math.ceil(maxVal * 1.1) },
  ];

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart
        data={data}
        margin={{ top: 8, right: 16, left: -8, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis
          type="number"
          dataKey="actual"
          name="Actual RUL"
          stroke="#64748b"
          fontSize={11}
          tickLine={false}
          axisLine={{ stroke: "#1e293b" }}
          label={{
            value: "Actual RUL (cycles)",
            position: "insideBottom",
            offset: -2,
            fill: "#64748b",
            fontSize: 11,
          }}
        />
        <YAxis
          type="number"
          dataKey="predicted"
          name="Predicted RUL"
          stroke="#64748b"
          fontSize={11}
          tickLine={false}
          axisLine={{ stroke: "#1e293b" }}
          width={64}
        />
        <Tooltip
          contentStyle={{
            background: "#0f172a",
            border: "1px solid #1e293b",
            borderRadius: 12,
            color: "#e2e8f0",
            fontSize: 12,
          }}
          labelStyle={{ color: "#94a3b8" }}
          formatter={(value: number, name: string) => [
            `${Math.round(value)} cyc`,
            name === "predicted" ? "Predicted" : name,
          ]}
          labelFormatter={(_, payload) => {
            const e = payload?.[0]?.payload as { engine?: string } | undefined;
            return e?.engine ? `Engine ${e.engine}` : "";
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, color: "#94a3b8" }}
          formatter={(v) => (v === "predicted" ? "Predicted RUL" : v)}
        />
        <ReferenceLine
          stroke="#334155"
          segment={[
            { x: 0, y: 0 },
            { x: Math.ceil(maxVal * 1.1), y: Math.ceil(maxVal * 1.1) },
          ]}
          ifOverflow="extendDomain"
        />
        <Line
          dataKey="ideal"
          data={lineData}
          stroke="#475569"
          strokeDasharray="5 5"
          dot={false}
          isAnimationActive={false}
          name="Ideal (y=x)"
        />
        <Scatter
          dataKey="predicted"
          fill="#22d3ee"
          fillOpacity={0.7}
          isAnimationActive={false}
          name="predicted"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
