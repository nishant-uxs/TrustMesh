"use client";

import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { Badge } from "@/components/ui/Badge";
import { useTrustData } from "@/hooks/useTrustData";
import { formatScore } from "@/lib/format";

export default function DashboardPage() {
  const { stats, orgs, relationships } = useTrustData();

  const cards = [
    { label: "Organizations", value: stats.totalOrgs, hint: `${stats.verifiedOrgs} verified` },
    { label: "Active relationships", value: stats.activeRels, hint: `${stats.completedRels} completed` },
    { label: "Verified reviews", value: stats.verifiedReviews, hint: `${stats.disputes} open disputes` },
    { label: "Avg trust score", value: formatScore(stats.avgTrust), hint: "Network baseline" },
  ];

  return (
    <div>
      <TopBar
        title="Dashboard"
        subtitle="Network health, trust signals, and live on-chain activity."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c, i) => (
          <div
            key={c.label}
            className="tm-surface rounded-2xl p-5 animate-fade-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <p className="text-xs uppercase tracking-[0.14em] text-slate">{c.label}</p>
            <p className="mt-3 font-display text-3xl text-deep">{c.value}</p>
            <p className="mt-1 text-xs text-sea">{c.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl text-deep">Recent organizations</h2>
            <Link href="/organizations" className="text-sm text-sea underline">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {orgs.slice(0, 4).map((org) => (
              <Link
                key={org.id}
                href={`/profile/${org.id}`}
                className="tm-surface flex items-center justify-between rounded-2xl p-4 transition hover:border-sea/30"
              >
                <div>
                  <p className="font-medium text-deep">{org.name}</p>
                  <p className="text-xs text-slate">{org.orgType}</p>
                </div>
                <div className="flex items-center gap-2">
                  {org.verified ? (
                    <Badge tone="success">Verified</Badge>
                  ) : (
                    <Badge>Unverified</Badge>
                  )}
                  <span className="font-mono text-sm text-deep">{org.trustScore}</span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8">
            <h2 className="mb-4 font-display text-2xl text-deep">Relationship pulse</h2>
            <div className="space-y-3">
              {relationships.map((rel) => (
                <div key={rel.id} className="tm-surface rounded-2xl p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-deep">{rel.title}</p>
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
                  <p className="mt-1 text-xs text-slate">
                    Org #{rel.orgA} ↔ Org #{rel.orgB}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="lg:col-span-2">
          <h2 className="mb-4 font-display text-2xl text-deep">Live activity</h2>
          <ActivityFeed limit={8} />
        </section>
      </div>
    </div>
  );
}
