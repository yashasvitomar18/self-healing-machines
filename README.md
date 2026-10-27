# Self-Healing Machines — Predictive Maintenance Dashboard

A professional, hackathon-ready frontend for **Tata Elxsi TELIPORT Season 4**:
*Self-Healing Machines — Predictive Maintenance for a Connected Fleet*.

This dashboard covers two modules:

1. **Machine Learning Approach & Model Evaluation** — RUL prediction, anomaly
   status/score, sensor-history charts, and actual-vs-predicted RUL evaluation
   with MAE / RMSE / R² metric cards.
2. **Rule-Based Triage Agent & Automated Maintenance Work Orders** —
   deterministic priority assignment, explanation, recommended action, a work
   order table with status controls, and a "Run engine analysis" button that
   drives the full predict → triage → work-order flow on the backend.

The actual ML models and triage rules run in a **Python FastAPI backend**.
The browser never fabricates predictions or metrics. Until the backend is
connected, the UI runs on **clearly labeled mock data** so every screen is
explorable during development.

---

## Tech stack

- React 18 + TypeScript
- Vite 7
- Tailwind CSS 3
- Recharts (visualizations)
- lucide-react (icons)

No LLMs, generative AI, chatbots, OpenAI APIs, or LangChain are used. No
machine learning is implemented in JavaScript.

---

## Getting started

### Prerequisites

- Node.js 18+ and npm

### Install & run

```bash
npm install
npm run dev
```

The app starts on the URL Vite prints (typically `http://localhost:5173`).

### Build & typecheck

```bash
npm run build        # production build
npm run typecheck    # TypeScript type check
npm run lint         # ESLint
```

---

## Connecting the FastAPI backend

The dashboard talks to a Python FastAPI backend through a single service layer.
Configure it with environment variables (Vite only exposes `VITE_`-prefixed
vars to the browser):

1. Copy `.env.example` to `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

2. Set the backend URL and disable mock mode:

   ```env
   VITE_API_BASE_URL=http://localhost:8000
   VITE_USE_MOCK=false
   ```

3. Restart `npm run dev`.

The header shows a badge with the active data source — **"Mock data (UI
preview)"** or **"Live API · &lt;url&gt;"** — so it is always obvious which
mode is running. When no `VITE_API_BASE_URL` is set, the app defaults to mock
mode automatically.

---

## Expected backend endpoints

The service layer (`src/api/client.ts`) expects these REST endpoints from the
FastAPI backend. All payloads are JSON.

| Method | Path                              | Response type        | Notes                                            |
|--------|-----------------------------------|----------------------|--------------------------------------------------|
| GET    | `/engines`                        | `EngineData[]`       | All monitored engines with recent sensor history |
| GET    | `/engines/{id}`                   | `EngineData`         | A single engine                                  |
| GET    | `/predictions/{id}`               | `RulPrediction`      | Predicted RUL (cycles) for one engine            |
| GET    | `/evaluation/metrics`             | `EvaluationMetrics`  | MAE, RMSE, R², and per-engine actual/predicted   |
| GET    | `/triage/{id}`                    | `TriageDecision`     | Rule-based priority + explanation + action       |
| POST   | `/triage/{id}/analyze`            | `AnalysisResult`     | Full run: predict + triage + generate work order |
| GET    | `/work-orders`                    | `WorkOrder[]`        | All work orders, newest first                    |
| PATCH  | `/work-orders/{id}/status`        | `WorkOrder`          | Body: `{ "status": "open" \| ... }`              |

Type definitions for every payload live in `src/api/types.ts` and are the
single source of truth shared by the service layer and the UI.

### Suggested FastAPI response shapes

See `src/api/types.ts` for the full contract. Key fields:

```jsonc
// EngineData
{
  "engineId": "1",
  "label": "Engine #1",
  "currentCycle": 192,
  "latestSensors": { "s2": 642.7, "s11": 47.5, /* ... */ },
  "history": [{ "cycle": 133, "s2": 641.9, /* ... */ }],
  "status": "warning",            // healthy | warning | critical | unknown
  "isAnomalous": true,
  "anomalyScore": 0.58
}

// RulPrediction
{ "engineId": "1", "predictedRul": 42, "actualRul": 40, "uncertainty": 14, "generatedAt": "2026-10-27T12:00:00Z" }

// EvaluationMetrics
{ "mae": 13.2, "rmse": 17.5, "r2": 0.93, "sampleCount": 4,
  "points": [{ "engineId": "1", "actualRul": 40, "predictedRul": 42 }],
  "computedAt": "2026-10-27T12:00:00Z" }

// TriageDecision
{ "engineId": "1", "priority": "high",
  "explanation": "RUL 42 cycles or anomaly 0.58 exceed high-priority thresholds.",
  "recommendedAction": "Plan maintenance within the next operating window.",
  "reasoning": { "predictedRul": 42, "anomalyScore": 0.58, "status": "warning" },
  "generatedAt": "2026-10-27T12:00:00Z" }

// WorkOrder
{ "id": "WO-1042", "engineId": "1", "priority": "high",
  "reason": "...", "recommendedAction": "...",
  "createdAt": "2026-10-27T11:20:00Z", "status": "open" }
```

Enable CORS on the FastAPI side so the browser can call the API directly:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type"],
)
```

---

## Project structure

```
src/
  api/
    types.ts        # All backend / domain TypeScript types
    config.ts       # API base URL + mock-mode resolution from env vars
    client.ts       # Service layer: one method per endpoint, mock or live
    mockData.ts     # Clearly-labeled synthetic data for UI development
  components/
    ui.tsx                      # Card, Badge, Spinner, ErrorBanner, EmptyState
    StatCard.tsx                # Overview metric card
    EngineSelector.tsx          # Engine dropdown
    SensorHistoryChart.tsx      # Recharts line chart of sensor telemetry
    RulScatterChart.tsx         # Actual vs predicted RUL scatter + identity line
    MlEvaluationModule.tsx      # Module 1: ML approach & evaluation
    TriageWorkOrderModule.tsx   # Module 2: triage + work orders
  lib/
    format.ts       # Display helpers + status/priority color metadata
  App.tsx           # Shell: header, overview cards, tab navigation
  main.tsx, index.css
```

---

## Notes on honesty of data

- Mock values are generated deterministically and are **not** model output. The
  header badge and footer both call out mock mode explicitly.
- The frontend never computes RUL, anomaly scores, or metrics itself. In live
  mode it only displays what the Python backend returns.
- Do not treat mock numbers as real results. Switch to live mode and verify
  the backend before presenting metrics as actual model performance.
