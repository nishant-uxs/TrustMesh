"use client";

import { classifyError, type AppError } from "./errors";
import { track } from "./analyticsClient";
import { reportError } from "./monitoringClient";
import type { TxPhase } from "./types";

export type PhaseSetter = (phase: TxPhase, extra?: { hash?: string; error?: string }) => void;

/**
 * Runs a signed Testnet action with shared analytics + error classification.
 * Pass the phase reporter into `buildAndSend` via your contract helper so the UI
 * can show simulating → signing → submitted → success|failed.
 */
export async function runSignedAction(
  action: string,
  execute: (report: PhaseSetter) => Promise<string>,
  setPhase?: PhaseSetter,
): Promise<{ ok: true; hash: string } | { ok: false; error: AppError }> {
  track("transaction_started", { action });
  const report: PhaseSetter = (phase, extra) => setPhase?.(phase, extra);
  try {
    const hash = await execute(report);
    track("transaction_succeeded", { action });
    setPhase?.("success", { hash });
    return { ok: true, hash };
  } catch (err) {
    const error = classifyError(err);
    track("transaction_failed", { action, kind: error.kind });
    reportError(error, action);
    setPhase?.("failed", { error: error.message });
    return { ok: false, error };
  }
}
