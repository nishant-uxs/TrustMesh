"use client";

import { classifyError, type AppError } from "./errors";
import { track } from "./analyticsClient";
import { reportError } from "./monitoringClient";
import type { TxPhase } from "./types";

export async function runSignedAction(
  action: string,
  execute: () => Promise<string>,
  setPhase?: (phase: TxPhase, extra?: { hash?: string; error?: string }) => void,
): Promise<{ ok: true; hash: string } | { ok: false; error: AppError }> {
  track("transaction_started", { action });
  setPhase?.("signing");
  try {
    const hash = await execute();
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
