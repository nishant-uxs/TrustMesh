"use client";

import { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorBanner, TxStatus } from "@/components/ui/ErrorBanner";
import { useTrustData } from "@/hooks/useTrustData";
import { useWallet } from "@/hooks/useWallet";
import { contractsConfigured } from "@/lib/config";
import { createRelationship } from "@/lib/contracts";
import { classifyError } from "@/lib/errors";
import { timeAgo } from "@/lib/format";
import type { TxState } from "@/lib/types";

export default function RelationshipsPage() {
  const { relationships, orgs } = useTrustData();
  const { address, connect } = useWallet();
  const [orgA, setOrgA] = useState(1);
  const [orgB, setOrgB] = useState(2);
  const [title, setTitle] = useState("");
  const [tx, setTx] = useState<TxState>({ phase: "idle" });
  const [error, setError] = useState<ReturnType<typeof classifyError> | null>(null);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!address) {
      await connect();
      return;
    }
    if (!contractsConfigured()) {
      setError(classifyError(new Error("not configured: missing contract")));
      return;
    }
    try {
      setTx({ phase: "simulating" });
      setTx({ phase: "signing" });
      const hash = await createRelationship(address, orgA, orgB, title);
      setTx({ phase: "success", hash });
      setTitle("");
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
        subtitle="Create and track verifiable business relationships across the trust graph."
      />
      <div className="grid gap-8 lg:grid-cols-5">
        <form onSubmit={onCreate} className="tm-surface space-y-4 rounded-2xl p-5 lg:col-span-2">
          <h2 className="font-display text-xl text-deep">Create relationship</h2>
          <label className="block text-sm">
            <span className="text-slate">Organization A</span>
            <select
              value={orgA}
              onChange={(e) => setOrgA(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-deep/15 bg-white px-3 py-2.5"
            >
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-slate">Organization B</span>
            <select
              value={orgB}
              onChange={(e) => setOrgB(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-deep/15 bg-white px-3 py-2.5"
            >
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-slate">Title</span>
            <input
              required
              minLength={3}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-deep/15 bg-white px-3 py-2.5"
              placeholder="Q3 logistics partnership"
            />
          </label>
          <Button type="submit" className="w-full" loading={tx.phase === "signing"}>
            {address ? "Create on-chain" : "Connect wallet"}
          </Button>
          <TxStatus phase={tx.phase} hash={tx.hash} />
          {error && <ErrorBanner error={error} onDismiss={() => setError(null)} />}
        </form>

        <div className="space-y-3 lg:col-span-3">
          {relationships.map((rel) => (
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
                Org #{rel.orgA} ↔ Org #{rel.orgB} · opened {timeAgo(rel.createdAt)}
              </p>
              {rel.disputeReason && (
                <p className="mt-2 text-sm text-coral">Dispute: {rel.disputeReason}</p>
              )}
              {rel.status === "Completed" && (
                <p className="mt-2 text-sm text-sea">Quality score {rel.qualityScore}</p>
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
