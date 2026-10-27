// API service layer for the Predictive Maintenance backend.
//
// Every method returns typed domain objects. When USE_MOCK is true the call is
// served by the labeled mock adapter; otherwise it performs a fetch against the
// FastAPI backend at API_BASE_URL. Components consume this single interface, so
// switching data sources requires only an env change — no UI edits.
//
// Expected FastAPI endpoints (backend contract):
//   GET    /engines                      -> EngineData[]
//   GET    /engines/{id}                 -> EngineData
//   GET    /predictions/{id}             -> RulPrediction
//   GET    /evaluation/metrics           -> EvaluationMetrics
//   GET    /triage/{id}                  -> TriageDecision
//   POST   /triage/{id}/analyze          -> AnalysisResult
//   GET    /work-orders                  -> WorkOrder[]
//   PATCH  /work-orders/{id}/status      -> WorkOrder  (body: { status })

import { API_BASE_URL, USE_MOCK } from "./config";
import * as mock from "./mockData";
import type {
  AnalysisResult,
  EngineData,
  EvaluationMetrics,
  RulPrediction,
  TriageDecision,
  WorkOrder,
  WorkOrderStatus,
} from "./types";

export class ApiClientError extends Error {
  status?: number;
  isMock: boolean;
  constructor(message: string, status?: number, isMock = false) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.isMock = isMock;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiClientError(
      "No API base URL configured. Set VITE_API_BASE_URL to use live data.",
      undefined,
      false
    );
  }
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? body.message ?? detail;
    } catch {
      /* keep statusText */
    }
    throw new ApiClientError(
      `API ${res.status}: ${detail}`,
      res.status,
      false
    );
  }
  return (await res.json()) as T;
}

/** Small delay so mock mode reflects realistic loading states. */
function delay<T>(value: T, ms = 420): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const api = {
  get isMockMode() {
    return USE_MOCK;
  },

  async listEngines(): Promise<EngineData[]> {
    if (USE_MOCK) return delay(mock.mockEngineList());
    return request<EngineData[]>("/engines");
  },

  async getEngine(engineId: string): Promise<EngineData> {
    if (USE_MOCK) return delay(mock.mockEngine(engineId));
    return request<EngineData>(`/engines/${encodeURIComponent(engineId)}`);
  },

  async getPrediction(engineId: string): Promise<RulPrediction> {
    if (USE_MOCK) return delay(mock.mockPrediction(engineId));
    return request<RulPrediction>(
      `/predictions/${encodeURIComponent(engineId)}`
    );
  },

  async getEvaluationMetrics(): Promise<EvaluationMetrics> {
    if (USE_MOCK) return delay(mock.mockEvaluationMetrics());
    return request<EvaluationMetrics>("/evaluation/metrics");
  },

  async getTriage(engineId: string): Promise<TriageDecision> {
    if (USE_MOCK) return delay(mock.mockTriage(engineId));
    return request<TriageDecision>(`/triage/${encodeURIComponent(engineId)}`);
  },

  async listWorkOrders(): Promise<WorkOrder[]> {
    if (USE_MOCK) return delay(mock.mockWorkOrders());
    return request<WorkOrder[]>("/work-orders");
  },

  async updateWorkOrderStatus(
    id: string,
    status: WorkOrderStatus
  ): Promise<WorkOrder> {
    if (USE_MOCK)
      return delay(mock.mockUpdateWorkOrderStatus(id, status), 260);
    return request<WorkOrder>(
      `/work-orders/${encodeURIComponent(id)}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }
    );
  },

  /** Run full analysis (predict + triage + work-order generation) on the backend. */
  async analyzeEngine(engineId: string): Promise<AnalysisResult> {
    if (USE_MOCK) {
      const prediction = mock.mockPrediction(engineId);
      const triage = mock.mockTriage(engineId);
      const workOrder: WorkOrder | null =
        triage.priority === "low"
          ? null
          : {
              id: `WO-${1000 + Math.floor(Math.random() * 900)}`,
              engineId,
              priority: triage.priority,
              reason: triage.explanation,
              recommendedAction: triage.recommendedAction,
              createdAt: new Date().toISOString(),
              status: "open",
            };
      return delay({ prediction, triage, workOrder }, 700);
    }
    return request<AnalysisResult>(
      `/triage/${encodeURIComponent(engineId)}/analyze`,
      { method: "POST" }
    );
  },
};
