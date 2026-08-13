"use client";

import { useEffect, useMemo, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { EmptyState } from "@/components/ui/Badge";
import { useTrustData } from "@/hooks/useTrustData";
import { formatScore } from "@/lib/format";
import {
  loadProductEvents,
  summarizeProductEvents,
  type ProductEventName,
} from "@/lib/analytics";
import { posthogConfigured } from "@/lib/monitoring";

const EVENT_LABELS: Record<ProductEventName, string> = {
  wallet_connected: "Wallets connected",
  wallet_disconnected: "Disconnects",
  onboarding_started: "Onboarding started",
  onboarding_completed: "Onboarding completed",
  organization_created: "Organizations created",
  relationship_created: "Relationships created",
  relationship_accepted: "Relationships accepted",
  relationship_completed: "Relationships completed",
  dispute_opened: "Disputes opened",
  review_submitted: "Reviews submitted",
  review_verified: "Reviews verified",
  transaction_started: "Transactions started",
  transaction_succeeded: "Transactions succeeded",
  transaction_failed: "Transactions failed",
  account_funded: "Testnet accounts funded",
};

export default function AnalyticsPage() {
  const { stats, orgs, relationships, reviews, reputation } = useTrustData();
  const [productCounts, setProductCounts] = useState<Record<ProductEventName, number> | null>(null);

  useEffect(() => {
    setProductCounts(summarizeProductEvents(loadProductEvents()));
  }, []);

  const byType = orgs.reduce<Record<string, number>>((acc, org) => {
    acc[org.orgType] = (acc[org.orgType] || 0) + 1;
    return acc;
  }, {});

  const statusCounts = relationships.reduce<Record<string, number>>((acc, rel) => {
    acc[rel.status] = (acc[rel.status] || 0) + 1;
    return acc;
  }, {});

  const maxType = Math.max(...Object.values(byType), 1);
  const disputeRate =
    relationships.length === 0
      ? 0
      : Object.values(reputation).reduce((s, r) => s + r.disputesOpened, 0) /
        relationships.length;

  const verificationRate =
    stats.totalOrgs === 0
      ? 0
      : Math.round((stats.verifiedOrgs / stats.totalOrgs) * 100);
  const completionRate =
    relationships.length === 0
      ? 0
      : Math.round((stats.completedRels / relationships.length) * 100);

  const productEntries = useMemo(
    () =>
      productCounts
        ? (Object.entries(productCounts) as [ProductEventName, number][]).filter(([, n]) => n > 0)
        : [],
    [productCounts],
  );

  return (
    <div>
      <TopBar
        title="Analytics"
        subtitle="On-chain network stats plus product usage from this browser (no fake numbers)."
      />

      <section className="mb-8 tm-surface rounded-2xl p-6">
        <div>
          <h2 className="font-display text-2xl text-deep">Product usage</h2>
          <p className="mt-1 text-sm text-slate">
            Events are stored locally in this browser. Wallet addresses are never stored in full.
            {posthogConfigured()
              ? " PostHog is also receiving anonymized events."
              : " Add NEXT_PUBLIC_POSTHOG_KEY to also send events to PostHog."}
          </p>
        </div>
        {productEntries.length === 0 ? (
          <p className="mt-6 text-sm text-slate">
            No product events yet. Connect a wallet or complete onboarding to generate real metrics.
          </p>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {productEntries.map(([name, count]) => (
              <div key={name} className="rounded-xl bg-foam/70 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate">{EVENT_LABELS[name]}</p>
                <p className="mt-2 font-display text-3xl text-deep">{count}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Verification rate", value: `${verificationRate}%` },
          { label: "Completion rate", value: `${completionRate}%` },
          { label: "Avg trust", value: formatScore(stats.avgTrust) },
          { label: "Dispute intensity", value: disputeRate.toFixed(2) },
        ].map((item) => (
          <div key={item.label} className="tm-surface rounded-2xl p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-slate">{item.label}</p>
            <p className="mt-3 font-display text-3xl text-deep">{item.value}</p>
          </div>
        ))}
      </div>

      {orgs.length === 0 && relationships.length === 0 ? (
        <div className="mt-8 tm-surface rounded-2xl">
          <EmptyState
            title="No on-chain analytics yet"
            description="Charts fill from real organizations and relationships on Testnet."
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <section className="tm-surface rounded-2xl p-6">
            <h2 className="font-display text-2xl text-deep">Organizations by type</h2>
            {Object.keys(byType).length === 0 ? (
              <p className="mt-6 text-sm text-slate">No organizations to chart.</p>
            ) : (
              <div className="mt-6 space-y-4">
                {Object.entries(byType).map(([type, count]) => (
                  <div key={type}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-deep">{type}</span>
                      <span className="text-slate">{count}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-deep/10">
                      <div
                        className="h-full rounded-full bg-sea"
                        style={{ width: `${(count / maxType) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="tm-surface rounded-2xl p-6">
            <h2 className="font-display text-2xl text-deep">Relationship outcomes</h2>
            {Object.keys(statusCounts).length === 0 ? (
              <p className="mt-6 text-sm text-slate">No relationships to chart.</p>
            ) : (
              <div className="mt-6 grid grid-cols-2 gap-4">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <div key={status} className="rounded-xl bg-foam/70 p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate">{status}</p>
                    <p className="mt-2 font-display text-3xl text-deep">{count}</p>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-6 text-sm text-slate">
              {reviews.filter((r) => r.status === "Verified").length} verified reviews across{" "}
              {orgs.length} organizations on the TrustMesh graph.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
