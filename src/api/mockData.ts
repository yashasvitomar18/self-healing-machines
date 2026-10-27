// Clearly-labeled mock data for UI development only.
//
// These values are synthetic and NOT model output. They exist so the dashboard
// is fully explorable before the Python FastAPI backend is connected. When the
// backend is available, set VITE_API_BASE_URL and VITE_USE_MOCK=false to switch
// to live data — no component changes required.
//
// Sensor ids and ranges are inspired by the NASA C-MAPSS turbofan dataset
// (train_FD001), which the backend targets, but the values here are generated,
// not measured. No ML inference happens in the browser.

import type {
  EngineData,
  EngineStatus,
  EvaluationMetrics,
  RulPrediction,
  SensorSample,
  TriageDecision,
  WorkOrder,
  WorkOrderStatus,
} from "./types";

// --- Synthetic generation helpers -------------------------------------------

const MOCK_ENGINES = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;

// A representative subset of C-MAPSS operational sensors.
const SENSOR_IDS = [
  "s2",
  "s3",
  "s4",
  "s7",
  "s8",
  "s9",
  "s11",
  "s12",
  "s13",
  "s14",
  "s15",
  "s17",
  "s20",
  "s21",
] as const;

// Baseline (healthy) center value and drift tendency per sensor.
const SENSOR_PROFILE: Record<
  string,
  { base: number; amp: number; drift: number }
> = {
  s2: { base: 642.7, amp: 1.6, drift: 0.004 },
  s3: { base: 1583.2, amp: 6.2, drift: 0.02 },
  s4: { base: 1400.6, amp: 4.1, drift: 0.01 },
  s7: { base: 554.0, amp: 3.5, drift: 0.003 },
  s8: { base: 2388.1, amp: 9.0, drift: 0.05 },
  s9: { base: 9062.5, amp: 18.0, drift: 0.08 },
  s11: { base: 47.5, amp: 0.35, drift: 0.0012 },
  s12: { base: 522.1, amp: 2.1, drift: 0.004 },
  s13: { base: 2388.2, amp: 9.1, drift: 0.05 },
  s14: { base: 8142.6, amp: 15.0, drift: 0.07 },
  s15: { base: 8.43, amp: 0.06, drift: 0.0003 },
  s17: { base: 393.0, amp: 2.0, drift: 0.0025 },
  s20: { base: 39.0, amp: 0.3, drift: 0.0011 },
  s21: { base: 2319.0, amp: 9.4, drift: 0.045 },
};

/** Deterministic pseudo-random generator so mock data is stable per engine. */
function seeded(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function buildHistory(
  engineIndex: number,
  totalCycles: number,
  degrade: boolean
): SensorSample[] {
  const rnd = seeded(1000 + engineIndex * 37);
  const window = 60; // last 60 cycles shown
  const startCycle = Math.max(1, totalCycles - window + 1);
  const samples: SensorSample[] = [];
  for (let c = startCycle; c <= totalCycles; c++) {
    const ageFraction = c / totalCycles; // 0..1 over life
    const driftFactor = degrade ? ageFraction : 0.15 * ageFraction;
    const sample: SensorSample = { cycle: c };
    for (const id of SENSOR_IDS) {
      const p = SENSOR_PROFILE[id];
      const noise = (rnd() - 0.5) * p.amp;
      const drift = p.drift * driftFactor * (engineIndex + 1);
      sample[id] = Number((p.base + drift + noise).toFixed(3));
    }
    samples.push(sample);
  }
  return samples;
}

function statusFromRulAnomaly(rul: number, anomaly: number): EngineStatus {
  if (anomaly >= 0.8 || rul <= 30) return "critical";
  if (anomaly >= 0.5 || rul <= 75) return "warning";
  return "healthy";
}

// --- Public mock fixtures ----------------------------------------------------

const ENGINE_RUL: Record<string, number> = {
  "1": 18,
  "2": 42,
  "3": 96,
  "4": 131,
  "5": 207,
  "6": 64,
  "7": 12,
  "8": 158,
};
const ENGINE_ANOMALY: Record<string, number> = {
  "1": 0.86,
  "2": 0.58,
  "3": 0.21,
  "4": 0.09,
  "5": 0.04,
  "6": 0.47,
  "7": 0.93,
  "8": 0.07,
};

export function mockEngineList(): EngineData[] {
  return MOCK_ENGINES.map((id, i) => {
    const rul = ENGINE_RUL[id];
    const anomaly = ENGINE_ANOMALY[id];
    const status = statusFromRulAnomaly(rul, anomaly);
    const totalCycles = 180 + i * 24;
    const history = buildHistory(i, totalCycles, status !== "healthy");
    const latestSensors: Record<string, number> = { ...history[history.length - 1] };
    delete latestSensors.cycle;
    return {
      engineId: id,
      label: `Engine #${id}`,
      currentCycle: totalCycles,
      latestSensors,
      history,
      status,
      isAnomalous: anomaly >= 0.5,
      anomalyScore: anomaly,
    };
  });
}

export function mockEngine(engineId: string): EngineData {
  const found = mockEngineList().find((e) => e.engineId === engineId);
  if (!found) {
    throw new Error(`Mock: unknown engine ${engineId}`);
  }
  return found;
}

export function mockPrediction(engineId: string): RulPrediction {
  const rul = ENGINE_RUL[engineId];
  if (rul === undefined) {
    throw new Error(`Mock: unknown engine ${engineId}`);
  }
  // Only engines flagged for evaluation have a ground-truth RUL.
  const hasActual = ["1", "2", "3", "4"].includes(engineId);
  return {
    engineId,
    predictedRul: rul + Math.round((Number(engineId) % 3) - 1), // small residual
    actualRul: hasActual ? rul : null,
    uncertainty: 14,
    generatedAt: new Date().toISOString(),
  };
}

export function mockEvaluationMetrics(): EvaluationMetrics {
  const evalIds = ["1", "2", "3", "4"];
  const points = evalIds.map((id) => {
    const actual = ENGINE_RUL[id];
    const predicted = actual + ((Number(id) * 7) % 11) - 5;
    return { engineId: id, actualRul: actual, predictedRul: predicted };
  });
  const errors = points.map((p) => Math.abs(p.predictedRul - p.actualRul));
  const mae = errors.reduce((a, b) => a + b, 0) / errors.length;
  const rmse = Math.sqrt(
    errors.reduce((a, b) => a + b * b, 0) / errors.length
  );
  return {
    mae: Number(mae.toFixed(2)),
    rmse: Number(rmse.toFixed(2)),
    r2: 0.93,
    sampleCount: points.length,
    points,
    computedAt: new Date().toISOString(),
  };
}

export function mockTriage(engineId: string): TriageDecision {
  const rul = ENGINE_RUL[engineId];
  const anomaly = ENGINE_ANOMALY[engineId];
  if (rul === undefined) {
    throw new Error(`Mock: unknown engine ${engineId}`);
  }
  const status = statusFromRulAnomaly(rul, anomaly);
  let priority: TriageDecision["priority"];
  let explanation: string;
  let action: string;
  if (rul <= 25 || anomaly >= 0.8) {
    priority = "critical";
    explanation = `RUL ${rul} cycles and anomaly score ${anomaly.toFixed(
      2
    )} exceed critical thresholds (RUL<=25 or anomaly>=0.80).`;
    action = "Schedule immediate inspection and component replacement.";
  } else if (rul <= 60 || anomaly >= 0.5) {
    priority = "high";
    explanation = `RUL ${rul} cycles or anomaly score ${anomaly.toFixed(
      2
    )} exceed high-priority thresholds (RUL<=60 or anomaly>=0.50).`;
    action = "Plan maintenance within the next operating window.";
  } else if (rul <= 120 || anomaly >= 0.3) {
    priority = "medium";
    explanation = `RUL ${rul} cycles and anomaly score ${anomaly.toFixed(
      2
    )} suggest moderate wear; monitor closely.`;
    action = "Add to the next scheduled maintenance review.";
  } else {
    priority = "low";
    explanation = `RUL ${rul} cycles and anomaly score ${anomaly.toFixed(
      2
    )} are within normal operating range.`;
    action = "No action required; continue routine monitoring.";
  }
  return {
    engineId,
    priority,
    explanation,
    recommendedAction: action,
    reasoning: { predictedRul: rul, anomalyScore: anomaly, status },
    generatedAt: new Date().toISOString(),
  };
}

const MOCK_WORK_ORDERS: WorkOrder[] = [
  {
    id: "WO-1042",
    engineId: "7",
    priority: "critical",
    reason:
      "RUL 12 cycles and anomaly 0.93 exceed critical thresholds; immediate action required.",
    recommendedAction: "Schedule immediate inspection and component replacement.",
    createdAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    status: "open",
  },
  {
    id: "WO-1041",
    engineId: "1",
    priority: "critical",
    reason:
      "RUL 18 cycles and anomaly 0.86 exceed critical thresholds; immediate action required.",
    recommendedAction: "Schedule immediate inspection and component replacement.",
    createdAt: new Date(Date.now() - 1000 * 60 * 88).toISOString(),
    status: "assigned",
  },
  {
    id: "WO-1038",
    engineId: "2",
    priority: "high",
    reason:
      "RUL 42 cycles or anomaly 0.58 exceed high-priority thresholds; plan maintenance soon.",
    recommendedAction: "Plan maintenance within the next operating window.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    status: "in_progress",
  },
  {
    id: "WO-1031",
    engineId: "6",
    priority: "medium",
    reason:
      "RUL 64 cycles and anomaly 0.47 suggest moderate wear; monitor closely.",
    recommendedAction: "Add to the next scheduled maintenance review.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    status: "open",
  },
  {
    id: "WO-1020",
    engineId: "3",
    priority: "low",
    reason:
      "RUL 96 cycles and anomaly 0.21 within normal range; routine monitoring.",
    recommendedAction: "No action required; continue routine monitoring.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
    status: "completed",
  },
];

export function mockWorkOrders(): WorkOrder[] {
  return [...MOCK_WORK_ORDERS].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function mockUpdateWorkOrderStatus(
  id: string,
  status: WorkOrderStatus
): WorkOrder {
  const order = MOCK_WORK_ORDERS.find((w) => w.id === id);
  if (!order) {
    throw new Error(`Mock: unknown work order ${id}`);
  }
  order.status = status;
  return { ...order };
}
