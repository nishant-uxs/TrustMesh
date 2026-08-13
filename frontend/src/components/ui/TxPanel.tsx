"use client";

import { explorerTxUrl } from "@/lib/format";
import type { TxState } from "@/lib/types";

const COPY: Record<string, { title: string; body: string }> = {
  simulating: {
    title: "Preparing your request",
    body: "Checking that this action is valid before your wallet opens.",
  },
  signing: {
    title: "Approve in your wallet",
    body: "A wallet popup should appear. Review it, then approve to continue. You can cancel if anything looks wrong.",
  },
  submitted: {
    title: "Waiting for confirmation",
    body: "The network is recording your action. This usually takes a few seconds.",
  },
  success: {
    title: "Done — recorded on Testnet",
    body: "Anyone can verify this record. Use the link below if you want a public receipt.",
  },
  failed: {
    title: "That did not go through",
    body: "Nothing was changed on-chain. You can fix the issue and try again.",
  },
};

export function TxPanel({
  tx,
  nextHint,
}: {
  tx: TxState;
  nextHint?: string;
}) {
  if (tx.phase === "idle") return null;
  const copy = COPY[tx.phase] || { title: tx.message || "Working…", body: "" };

  return (
    <div className="tm-surface rounded-2xl p-4 animate-fade-up" role="status" aria-live="polite">
      <p className="text-sm font-semibold text-deep">{copy.title}</p>
      <p className="mt-1 text-sm text-slate">{copy.body}</p>
      {tx.phase === "failed" && tx.error && (
        <p className="mt-2 text-sm text-coral">{tx.error}</p>
      )}
      {tx.phase === "success" && nextHint && (
        <p className="mt-2 text-sm text-sea">{nextHint}</p>
      )}
      {tx.hash && (
        <a
          className="mt-2 inline-block text-xs text-sea underline"
          href={explorerTxUrl(tx.hash)}
          target="_blank"
          rel="noreferrer"
        >
          View public receipt
        </a>
      )}
    </div>
  );
}
