"use client";

import { useState } from "react";
import type { AppError } from "@/lib/errors";
import { fundTestnetAccount } from "@/lib/horizon";
import { track } from "@/lib/analyticsClient";
import { toast } from "@/components/providers/ToastProvider";
import { Button } from "./Button";

export function ErrorBanner({
  error,
  onDismiss,
  dismissLabel = "Dismiss",
  address,
}: {
  error: AppError | { message: string; technical?: string; kind?: string };
  onDismiss?: () => void;
  dismissLabel?: string;
  address?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [funding, setFunding] = useState(false);
  const canFund = error.kind === "AccountNotFunded" && Boolean(address);
  const wrongNetwork = error.kind === "WrongNetwork";

  async function onFund() {
    if (!address) return;
    setFunding(true);
    try {
      await fundTestnetAccount(address);
      track("account_funded");
      toast.success("Test funds added. Try the action again.");
      onDismiss?.();
    } catch {
      toast.error("Could not add test funds. Wait a minute and retry.");
    } finally {
      setFunding(false);
    }
  }

  return (
    <div
      className="tm-surface rounded-2xl border-coral/30 bg-coral/5 p-4 animate-fade-up"
      role="alert"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-coral">{error.message}</p>
          {canFund && (
            <Button className="mt-3" size="sm" loading={funding} onClick={() => void onFund()}>
              Add free Testnet funds
            </Button>
          )}
          {wrongNetwork && (
            <p className="mt-3 text-xs text-slate">
              Open your wallet extension → Network → <strong>Testnet</strong>, then retry the
              action.
            </p>
          )}
          {error.technical && (
            <button
              className="mt-2 block text-xs text-slate underline"
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
            {dismissLabel}
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
    simulating: "Checking this action…",
    signing: "Approve in your wallet…",
    submitted: "Waiting for the network to confirm…",
    success: "Confirmed on Testnet",
    failed: "That did not go through",
  };
  return (
    <div className="tm-surface rounded-2xl p-4 animate-fade-up" role="status">
      <p className="text-sm font-medium text-deep">{labels[phase] || message}</p>
      {hash && (
        <a
          className="mt-2 inline-block text-xs text-sea underline"
          href={`https://stellar.expert/explorer/testnet/tx/${hash}`}
          target="_blank"
          rel="noreferrer"
        >
          View public receipt
        </a>
      )}
    </div>
  );
}
