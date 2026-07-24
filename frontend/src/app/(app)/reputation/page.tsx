"use client";

import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { useTrustData } from "@/hooks/useTrustData";
import { formatScore, ratingFromBps } from "@/lib/format";

export default function ReputationPage() {
  const { orgs, reputation } = useTrustData();
  const ranked = [...orgs].sort((a, b) => (b.trustScore || 0) - (a.trustScore || 0));

  return (
    <div>
      <TopBar
        title="Reputation"
        subtitle="Trust scores derived from completed relationships, verified reviews, and dispute history."
      />
      <div className="space-y-4">
        {ranked.map((org, idx) => {
          const score = reputation[org.id];
          return (
            <Link
              key={org.id}
              href={`/profile/${org.id}`}
              className="tm-surface grid gap-4 rounded-2xl p-5 transition hover:border-sea/30 md:grid-cols-[auto_1fr_auto] md:items-center animate-fade-up"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-deep text-lg font-semibold text-white">
                #{idx + 1}
              </div>
              <div>
                <h3 className="font-display text-xl text-deep">{org.name}</h3>
                <p className="mt-1 text-sm text-slate">
                  {score?.completedRelationships ?? 0} completed ·{" "}
                  {score?.verifiedReviews ?? 0} reviews · avg{" "}
                  {ratingFromBps(score?.averageRatingBps || 0)}★ ·{" "}
                  {score?.disputesLost ?? 0} disputes lost
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-deep/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sea to-mint transition-all"
                    style={{ width: `${Math.min(100, ((org.trustScore || 0) / 1000) * 100)}%` }}
                  />
                </div>
              </div>
              <div className="text-right">
                <p className="font-display text-3xl text-deep">
                  {formatScore(org.trustScore || 0)}
                </p>
                <p className="text-xs uppercase tracking-[0.14em] text-slate">trust</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
