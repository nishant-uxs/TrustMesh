"use client";

import { useState } from "react";
import type { AppError } from "@/lib/errors";
import { Button } from "./Button";

export function ErrorBanner({
  error,
  onDismiss,
}: {
  error: AppError | { message: string; technical?: string; kind?: string };
  onDismiss?: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="tm-surface rounded-2xl border-coral/30 bg-coral/5 p-4 animate-fade-up">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-coral">
            {error.kind ? `${error.kind}: ` : ""}
            {error.message}
          </p>
          {error.technical && (
            <button
              className="mt-2 text-xs text-slate underline"
              onClick={() => setOpen((v) => !v)}
              type="button"
            >
              {open ? "Hide" : "Show"} technical details
            </button>
          )}
          {open && error.technical && (
            <pre className="mt-2 overflow-x-auto rounded-lg bg-ink/5 p-2 text-[11px] text-slate">
              {error.technical}
            </pre>
          )}
        </div>
        {onDismiss && (
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            Dismiss
          </Button>
        )}
      </div>
    </div>
  );
}

export function TxStatus({
  phase,
  hash,
  message,
}: {
  phase: string;
  hash?: string;
  message?: string;
}) {
  if (phase === "idle") return null;
  const labels: Record<string, string> = {
    simulating: "Simulating against Soroban RPC…",
    signing: "Waiting for wallet signature…",
    submitted: "Submitted — confirming on Testnet…",
    success: "Confirmed on Stellar Testnet",
    failed: "Transaction failed",
  };
  return (
    <div className="tm-surface rounded-2xl p-4 animate-fade-up">
      <p className="text-sm font-medium text-deep">{labels[phase] || message}</p>
      {hash && (
        <a
          className="mt-2 inline-block text-xs text-sea underline"
          href={`https://stellar.expert/explorer/testnet/tx/${hash}`}
          target="_blank"
          rel="noreferrer"
        >
          View on Stellar Expert
        </a>
      )}
    </div>
  );
}
