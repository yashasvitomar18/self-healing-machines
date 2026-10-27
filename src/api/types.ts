// Domain types for the Predictive Maintenance dashboard.
// These mirror the JSON shapes returned by the Python FastAPI backend.

/** Health status of an engine, derived from RUL and anomaly score. */
export type EngineStatus = "healthy" | "warning" | "critical" | "unknown";

/** Triaged maintenance priority assigned by the deterministic rule-based agent. */
export type MaintenancePriority = "low" | "medium" | "high" | "critical";

/** Lifecycle stage of a maintenance work order. */
export type WorkOrderStatus =
  | "open"
  | "assigned"
  | "in_progress"
  | "completed"
  | "cancelled";

/** A single sensor reading sampled at one operating cycle. */
export interface SensorSample {
  /** Operating cycle index (time step). */
  cycle: number;
  /** Sensor value keyed by sensor id (e.g. "s2", "s11"). */
  [sensor: string]: number;
}

/** Per-engine telemetry, history, and latest derived signal. */
export interface EngineData {
  engineId: string;
  /** Human-readable label, e.g. "Engine #14". */
  label: string;
  /** Total operating cycles recorded so far. */
  currentCycle: number;
  /** Latest sensor snapshot keyed by sensor id. */
  latestSensors: Record<string, number>;
  /** Time series of sensor samples, oldest -> newest. */
  history: SensorSample[];
  status: EngineStatus;
  /** True when the anomaly detector flagged the latest window. */
  isAnomalous: boolean;
  /** Anomaly score from the isolation-forest style detector (0..1). */
  anomalyScore: number;
}

/** Remaining-useful-life prediction for a single engine. */
export interface RulPrediction {
  engineId: string;
  /** Predicted RUL in remaining operating cycles. */
  predictedRul: number;
  /** Ground-truth RUL if known (evaluation engines only). */
  actualRul: number | null;
  /** Model confidence band, in cycles (e.g. +-15). */
  uncertainty: number | null;
  /** ISO timestamp the prediction was generated. */
  generatedAt: string;
}

/** Engine-level evaluation result: actual vs predicted RUL. */
export interface EvaluationPoint {
  engineId: string;
  actualRul: number;
  predictedRul: number;
}

/** Aggregate regression metrics over an evaluation set. */
export interface EvaluationMetrics {
  /** Mean absolute error in cycles. */
  mae: number;
  /** Root mean squared error in cycles. */
  rmse: number;
  /** R-squared score (0..1). */
  r2: number | null;
  /** Number of engines evaluated. */
  sampleCount: number;
  /** Per-engine actual/predicted pairs for the scatter chart. */
  points: EvaluationPoint[];
  /** ISO timestamp the metrics were computed. */
  computedAt: string;
}

/** Rule-based triage decision for a single engine. */
export interface TriageDecision {
  engineId: string;
  priority: MaintenancePriority;
  /** Short, deterministic explanation of why this priority was chosen. */
  explanation: string;
  /** Recommended maintenance action. */
  recommendedAction: string;
  /** Structured rule inputs that drove the decision. */
  reasoning: {
    predictedRul: number;
    anomalyScore: number;
    status: EngineStatus;
  };
  /** ISO timestamp the decision was produced. */
  generatedAt: string;
}

/** A maintenance work order created from a triage decision. */
export interface WorkOrder {
  id: string;
  engineId: string;
  priority: MaintenancePriority;
  /** Human-readable reason for the order. */
  reason: string;
  /** Recommended action to perform. */
  recommendedAction: string;
  /** ISO timestamp the order was created. */
  createdAt: string;
  status: WorkOrderStatus;
}

/** Result of running full analysis for an engine (predict + triage + WO). */
export interface AnalysisResult {
  prediction: RulPrediction;
  triage: TriageDecision;
  workOrder: WorkOrder | null;
}

/** Normalized error returned by the API layer. */
export interface ApiError {
  message: string;
  /** HTTP status if available. */
  status?: number;
  /** Whether this came from the mock data source. */
  isMock?: boolean;
}
