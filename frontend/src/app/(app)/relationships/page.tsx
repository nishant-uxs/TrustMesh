"use client";

import { useMemo, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { toast } from "@/components/providers/ToastProvider";
import { Badge, EmptyState, Skeleton } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorBanner, TxStatus } from "@/components/ui/ErrorBanner";
import { Pagination, SearchFilters } from "@/components/ui/SearchFilters";
import { useTrustData } from "@/hooks/useTrustData";
import { useWallet } from "@/hooks/useWallet";
import { contractsConfigured } from "@/lib/config";
import {
  acceptRelationship,
  completeRelationship,
  createRelationship,
  openDispute,
} from "@/lib/contracts";
import { runSignedAction } from "@/lib/tx";
import { track } from "@/lib/analyticsClient";
import { classifyError } from "@/lib/errors";
import { timeAgo } from "@/lib/format";
import type { TxState } from "@/lib/types";

const PAGE_SIZE = 5;

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
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState<{
    action: "complete" | "dispute";
    id: number;
  } | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return relationships.filter((rel) => {
      if (filter !== "all" && rel.status.toLowerCase() !== filter) return false;
      if (!q) return true;
      return (
        rel.title.toLowerCase().includes(q) ||
        String(rel.id).includes(q) ||
        String(rel.orgA).includes(q) ||
        String(rel.orgB).includes(q)
      );
    });
  }, [relationships, query, filter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
    const result = await runSignedAction(
      "create_relationship",
      () => createRelationship(wallet, a, b, title),
      (phase, extra) => setTx({ phase, hash: extra?.hash, error: extra?.error }),
    );
    if (!result.ok) {
      setError(result.error);
      toast.error(result.error.message);
      return;
    }
    track("relationship_created");
    toast.success("Relationship created. Both sides still need to accept.");
    setTitle("");
    await refresh(true);
  }

  async function runRelAction(
    action: "accept" | "complete" | "dispute",
    relationshipId: number,
  ) {
    setError(null);
    const wallet = await ensureWallet();
    if (!wallet) return;
    const result = await runSignedAction(
      action,
      async () => {
        if (action === "accept") return acceptRelationship(wallet, relationshipId);
        if (action === "complete") return completeRelationship(wallet, relationshipId, quality);
        return openDispute(wallet, relationshipId, disputeReason || "Scope disagreement");
      },
      (phase, extra) => setTx({ phase, hash: extra?.hash, error: extra?.error }),
    );
    if (!result.ok) {
      setError(result.error);
      toast.error(result.error.message);
      setConfirm(null);
      return;
    }
    track(
      action === "accept"
        ? "relationship_accepted"
        : action === "complete"
          ? "relationship_completed"
          : "dispute_opened",
    );
    toast.success(
      action === "accept"
        ? "You accepted this relationship"
        : action === "complete"
          ? "Completion recorded"
          : "Dispute opened",
    );
    setConfirm(null);
    await refresh(true);
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
          {error && <ErrorBanner error={error} address={address} onDismiss={() => setError(null)} />}
        </form>

        <div className="space-y-4 lg:col-span-3">
          <SearchFilters
            placeholder="Search relationships…"
            filters={[
              { label: "All", value: "all" },
              { label: "Pending", value: "pending" },
              { label: "Active", value: "active" },
              { label: "Completed", value: "completed" },
              { label: "Disputed", value: "disputed" },
            ]}
            onSearch={(q) => {
              setQuery(q);
              setPage(1);
            }}
            onFilter={(v) => {
              setFilter(v);
              setPage(1);
            }}
          />
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))
          ) : pageItems.length === 0 ? (
            <div className="tm-surface rounded-2xl">
              <EmptyState
                title="No relationships yet"
                description="Create a relationship between two verified organizations to populate this list."
              />
            </div>
          ) : (
            pageItems.map((rel) => (
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
                      <Button size="sm" onClick={() => setConfirm({ action: "complete", id: rel.id })}>
                        Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setConfirm({ action: "dispute", id: rel.id })}
                      >
                        Open dispute
                      </Button>
                    </>
                  )}
                </div>
              </article>
            ))
          )}
          <Pagination page={page} pageCount={pageCount} onChange={setPage} />
        </div>
      </div>

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.action === "dispute" ? "Open dispute?" : "Complete relationship?"}
        description={
          confirm?.action === "dispute"
            ? "This marks the relationship as disputed and updates reputation signals on-chain."
            : "Both parties must complete. This writes a permanent completion record on Testnet."
        }
        confirmLabel={confirm?.action === "dispute" ? "Open dispute" : "Complete"}
        danger={confirm?.action === "dispute"}
        loading={tx.phase === "signing"}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) void runRelAction(confirm.action, confirm.id);
        }}
      />
    </div>
  );
}
