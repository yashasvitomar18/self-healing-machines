import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import type { EngineData } from "@/api/types";
import { SENSOR_COLORS, SENSOR_LABELS } from "./sensorMeta";

export function SensorHistoryChart({
  engine,
  selectedSensors,
}: {
  engine: EngineData;
  selectedSensors: string[];
}) {
  const data = engine.history.map((s) => ({ ...s }));
  const sensors = selectedSensors.filter((id) =>
    data.length > 0 ? id in data[0] : false
  );

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis
          dataKey="cycle"
          stroke="#64748b"
          fontSize={11}
          tickLine={false}
          axisLine={{ stroke: "#1e293b" }}
          label={{
            value: "Operating cycle",
            position: "insideBottom",
            offset: -2,
            fill: "#64748b",
            fontSize: 11,
          }}
        />
        <YAxis
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
          labelFormatter={(v) => `Cycle ${v}`}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, color: "#94a3b8" }}
          formatter={(v) => SENSOR_LABELS[v as string] ?? v}
        />
        {sensors.map((id) => (
          <Line
            key={id}
            type="monotone"
            dataKey={id}
            stroke={SENSOR_COLORS[id] ?? "#22d3ee"}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
