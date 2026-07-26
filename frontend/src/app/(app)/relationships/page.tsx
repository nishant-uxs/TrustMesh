"use client";

import { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Badge, EmptyState, Skeleton } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorBanner, TxStatus } from "@/components/ui/ErrorBanner";
import { useTrustData } from "@/hooks/useTrustData";
import { useWallet } from "@/hooks/useWallet";
import { contractsConfigured } from "@/lib/config";
import {
  acceptRelationship,
  completeRelationship,
  createRelationship,
  openDispute,
} from "@/lib/contracts";
import { classifyError } from "@/lib/errors";
import { timeAgo } from "@/lib/format";
import type { TxState } from "@/lib/types";

export default function RelationshipsPage() {
  const { relationships, orgs, loading, refresh } = useTrustData();
  const { address, connect } = useWallet();
  const [orgA, setOrgA] = useState("");
  const [orgB, setOrgB] = useState("");
  const [title, setTitle] = useState("");
  const [quality, setQuality] = useState(90);
  const [disputeReason, setDisputeReason] = useState("");
  const [tx, setTx] = useState<TxState>({ phase: "idle" });
  const [error, setError] = useState<ReturnType<typeof classifyError> | null>(null);

  async function ensureWallet(): Promise<string | null> {
    if (address) return address;
    await connect();
    return null;
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const wallet = await ensureWallet();
    if (!wallet) return;
    const a = Number(orgA);
    const b = Number(orgB);
    if (!a || !b || a === b) {
      setError(classifyError(new Error("contract: enter two different organization IDs")));
      return;
    }
    if (!contractsConfigured()) {
      setError(classifyError(new Error("not configured: missing contract")));
      return;
    }
    try {
      setTx({ phase: "signing" });
      const hash = await createRelationship(wallet, a, b, title);
      setTx({ phase: "success", hash });
      setTitle("");
      await refresh();
    } catch (err) {
      const appErr = classifyError(err);
      setError(appErr);
      setTx({ phase: "failed", error: appErr.message });
    }
  }

  async function runRelAction(
    action: "accept" | "complete" | "dispute",
    relationshipId: number,
  ) {
    setError(null);
    const wallet = await ensureWallet();
    if (!wallet) return;
    try {
      setTx({ phase: "signing" });
      let hash = "";
      if (action === "accept") hash = await acceptRelationship(wallet, relationshipId);
      if (action === "complete") {
        hash = await completeRelationship(wallet, relationshipId, quality);
      }
      if (action === "dispute") {
        hash = await openDispute(
          wallet,
          relationshipId,
          disputeReason || "Scope disagreement",
        );
      }
      setTx({ phase: "success", hash });
      await refresh();
    } catch (err) {
      const appErr = classifyError(err);
      setError(appErr);
      setTx({ phase: "failed", error: appErr.message });
    }
  }

  return (
    <div>
      <TopBar
        title="Relationships"
        subtitle="Create and manage verifiable business relationships on Stellar Testnet."
      />
      <div className="grid gap-8 lg:grid-cols-5">
        <form onSubmit={onCreate} className="tm-surface space-y-4 rounded-2xl p-5 lg:col-span-2">
          <h2 className="font-display text-xl text-deep">Create relationship</h2>
          <p className="text-xs text-slate">
            Both organizations must be registered and verified. Enter on-chain org IDs.
          </p>
          <label className="block text-sm">
            <span className="text-slate">Organization A ID</span>
            {orgs.length > 0 ? (
              <select
                required
                value={orgA}
                onChange={(e) => setOrgA(e.target.value)}
                className="mt-1 w-full rounded-xl border border-deep/15 bg-white px-3 py-2.5"
              >
                <option value="">Select</option>
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    #{o.id} {o.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                required
                type="number"
                min={1}
                value={orgA}
                onChange={(e) => setOrgA(e.target.value)}
                className="mt-1 w-full rounded-xl border border-deep/15 bg-white px-3 py-2.5"
              />
            )}
          </label>
          <label className="block text-sm">
            <span className="text-slate">Organization B ID</span>
            {orgs.length > 0 ? (
              <select
                required
                value={orgB}
                onChange={(e) => setOrgB(e.target.value)}
                className="mt-1 w-full rounded-xl border border-deep/15 bg-white px-3 py-2.5"
              >
                <option value="">Select</option>
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    #{o.id} {o.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                required
                type="number"
                min={1}
                value={orgB}
                onChange={(e) => setOrgB(e.target.value)}
                className="mt-1 w-full rounded-xl border border-deep/15 bg-white px-3 py-2.5"
              />
            )}
          </label>
          <label className="block text-sm">
            <span className="text-slate">Title</span>
            <input
              required
              minLength={3}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-deep/15 bg-white px-3 py-2.5"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate">Complete quality (1–100)</span>
            <input
              type="number"
              min={1}
              max={100}
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-deep/15 bg-white px-3 py-2.5"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate">Dispute reason</span>
            <input
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              className="mt-1 w-full rounded-xl border border-deep/15 bg-white px-3 py-2.5"
            />
          </label>
          <Button type="submit" className="w-full" loading={tx.phase === "signing"}>
            {address ? "Create on-chain" : "Connect wallet"}
          </Button>
          <TxStatus phase={tx.phase} hash={tx.hash} />
          {error && <ErrorBanner error={error} onDismiss={() => setError(null)} />}
        </form>

        <div className="space-y-3 lg:col-span-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))
          ) : relationships.length === 0 ? (
            <div className="tm-surface rounded-2xl">
              <EmptyState
                title="No relationships yet"
                description="Create a relationship between two verified organizations to populate this list."
              />
            </div>
          ) : (
            relationships.map((rel) => (
              <article key={rel.id} className="tm-surface rounded-2xl p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-display text-xl text-deep">{rel.title}</h3>
                  <Badge
                    tone={
                      rel.status === "Completed"
                        ? "success"
                        : rel.status === "Disputed"
                          ? "danger"
                          : rel.status === "Active"
                            ? "info"
                            : "neutral"
                    }
                  >
                    {rel.status}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-slate">
                  #{rel.id} · Org #{rel.orgA} ↔ Org #{rel.orgB} · {timeAgo(rel.createdAt)}
                </p>
                {rel.disputeReason && (
                  <p className="mt-2 text-sm text-coral">Dispute: {rel.disputeReason}</p>
                )}
                {rel.status === "Completed" && (
                  <p className="mt-2 text-sm text-sea">Quality score {rel.qualityScore}</p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  {rel.status === "Pending" && (
                    <Button size="sm" variant="secondary" onClick={() => runRelAction("accept", rel.id)}>
                      Accept
                    </Button>
                  )}
                  {rel.status === "Active" && (
                    <>
                      <Button size="sm" onClick={() => runRelAction("complete", rel.id)}>
                        Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => runRelAction("dispute", rel.id)}
                      >
                        Open dispute
                      </Button>
                    </>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
