// Small display helpers shared across the dashboard.

import type {
  EngineStatus,
  MaintenancePriority,
  WorkOrderStatus,
} from "@/api/types";

export function formatRul(cycles: number | null | undefined): string {
  if (cycles === null || cycles === undefined) return "—";
  return `${Math.round(cycles)} cyc`;
}

export function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return "—";
  return score.toFixed(2);
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return "—";
  const diff = Date.now() - d;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

export const STATUS_META: Record<
  EngineStatus,
  { label: string; dot: string; text: string; bg: string; ring: string }
> = {
  healthy: {
    label: "Healthy",
    dot: "bg-emerald-400",
    text: "text-emerald-300",
    bg: "bg-emerald-500/10",
    ring: "ring-emerald-500/30",
  },
  warning: {
    label: "Warning",
    dot: "bg-amber-400",
    text: "text-amber-300",
    bg: "bg-amber-500/10",
    ring: "ring-amber-500/30",
  },
  critical: {
    label: "Critical",
    dot: "bg-rose-400",
    text: "text-rose-300",
    bg: "bg-rose-500/10",
    ring: "ring-rose-500/30",
  },
  unknown: {
    label: "Unknown",
    dot: "bg-slate-400",
    text: "text-slate-300",
    bg: "bg-slate-500/10",
    ring: "ring-slate-500/30",
  },
};

export const PRIORITY_META: Record<
  MaintenancePriority,
  { label: string; text: string; bg: string; border: string }
> = {
  critical: {
    label: "Critical",
    text: "text-rose-300",
    bg: "bg-rose-500/10",
    border: "border-rose-500/40",
  },
  high: {
    label: "High",
    text: "text-orange-300",
    bg: "bg-orange-500/10",
    border: "border-orange-500/40",
  },
  medium: {
    label: "Medium",
    text: "text-amber-300",
    bg: "bg-amber-500/10",
    border: "border-amber-500/40",
  },
  low: {
    label: "Low",
    text: "text-sky-300",
    bg: "bg-sky-500/10",
    border: "border-sky-500/40",
  },
};

export const WORK_ORDER_STATUS_META: Record<
  WorkOrderStatus,
  { label: string; text: string; bg: string }
> = {
  open: { label: "Open", text: "text-sky-300", bg: "bg-sky-500/10" },
  assigned: {
    label: "Assigned",
    text: "text-violet-300",
    bg: "bg-violet-500/10",
  },
  in_progress: {
    label: "In Progress",
    text: "text-amber-300",
    bg: "bg-amber-500/10",
  },
  completed: {
    label: "Completed",
    text: "text-emerald-300",
    bg: "bg-emerald-500/10",
  },
  cancelled: {
    label: "Cancelled",
    text: "text-slate-300",
    bg: "bg-slate-500/10",
  },
};

export const WORK_ORDER_STATUS_ORDER: WorkOrderStatus[] = [
  "open",
  "assigned",
  "in_progress",
  "completed",
  "cancelled",
];
