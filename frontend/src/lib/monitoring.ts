import { classifyError, type AppError } from "./errors";

export interface Incident {
  id: string;
  at: number;
  message: string;
  kind: string;
  context?: string;
}

const STORAGE_KEY = "tm-incidents";
const MAX_INCIDENTS = 80;

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadIncidents(): Incident[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Incident[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function persistIncidents(incidents: Incident[]): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(incidents.slice(-MAX_INCIDENTS)));
}

export function recordIncident(error: unknown, context?: string): AppError {
  const appErr = error instanceof Error && "kind" in error ? (error as AppError) : classifyError(error);
  const incident: Incident = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    at: Date.now(),
    message: appErr.message,
    kind: appErr.kind,
    context,
  };
  persistIncidents([...loadIncidents(), incident]);
  return appErr;
}

export function sentryConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);
}

export function posthogConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);
}
