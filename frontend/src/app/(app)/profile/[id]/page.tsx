"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Badge";
import { useTrustData } from "@/hooks/useTrustData";
import { formatScore, ratingFromBps, shortenAddress, timeAgo } from "@/lib/format";

export default function PublicProfilePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { orgs, relationships, reviews, reputation } = useTrustData();
  const org = orgs.find((o) => o.id === id);
  const score = reputation[id];

  if (!org) {
    return (
      <div>
        <TopBar title="Public profile" />
        <EmptyState
          title="Organization not found"
          description="This organization ID is not in the current TrustMesh dataset."
        />
      </div>
    );
  }

  const related = relationships.filter((r) => r.orgA === id || r.orgB === id);
  const orgReviews = reviews.filter((r) => r.revieweeOrg === id);

  return (
    <div>
      <TopBar
        title={org.name}
        subtitle={`Public trust profile · ${org.orgType}`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="tm-surface rounded-2xl p-6 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl text-deep">{org.name}</h2>
              <p className="mt-2 font-mono text-xs text-slate">
                {shortenAddress(org.owner, 6)}
              </p>
              <p className="mt-3 text-sm text-slate">
                Registered {timeAgo(org.registeredAt)} · {org.vendorCount} vendors ·{" "}
                {org.metadataUri}
              </p>
            </div>
            {org.verified ? (
              <Badge tone="success">Verified</Badge>
            ) : (
              <Badge tone="warn">Unverified</Badge>
            )}
          </div>

          <div className="mt-8">
            <h3 className="font-display text-xl text-deep">Relationship history</h3>
            <div className="mt-3 space-y-3">
              {related.map((rel) => (
                <div key={rel.id} className="rounded-xl bg-foam/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-deep">{rel.title}</p>
                    <Badge
                      tone={
                        rel.status === "Completed"
                          ? "success"
                          : rel.status === "Disputed"
                            ? "danger"
                            : "info"
                      }
                    >
                      {rel.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {!related.length && (
                <p className="text-sm text-slate">No relationships yet.</p>
              )}
            </div>
          </div>

          <div className="mt-8">
            <h3 className="font-display text-xl text-deep">Reviews received</h3>
            <div className="mt-3 space-y-3">
              {orgReviews.map((review) => (
                <div key={review.id} className="rounded-xl border border-deep/10 p-4">
                  <p className="text-amber">{"★".repeat(review.rating)}</p>
                  <p className="mt-1 font-mono text-xs text-slate">{review.commentHash}</p>
                  <Badge
                    tone={review.status === "Verified" ? "success" : "warn"}
                  >
                    {review.status}
                  </Badge>
                </div>
              ))}
              {!orgReviews.length && (
                <p className="text-sm text-slate">No reviews yet.</p>
              )}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="tm-surface rounded-2xl p-6 text-center">
            <p className="text-xs uppercase tracking-[0.14em] text-slate">Trust score</p>
            <p className="mt-3 font-display text-5xl text-deep">
              {formatScore(org.trustScore || 0)}
            </p>
            <div className="mx-auto mt-4 h-2 w-full overflow-hidden rounded-full bg-deep/10">
              <div
                className="h-full bg-gradient-to-r from-sea to-mint"
                style={{
                  width: `${Math.min(100, ((org.trustScore || 0) / 1000) * 100)}%`,
                }}
              />
            </div>
          </div>
          <div className="tm-surface space-y-3 rounded-2xl p-6 text-sm">
            <Row label="Completed" value={String(score?.completedRelationships ?? 0)} />
            <Row label="Verified reviews" value={String(score?.verifiedReviews ?? 0)} />
            <Row label="Avg rating" value={`${ratingFromBps(score?.averageRatingBps || 0)}★`} />
            <Row label="Disputes opened" value={String(score?.disputesOpened ?? 0)} />
            <Row label="Disputes lost" value={String(score?.disputesLost ?? 0)} />
          </div>
          <Link href="/reputation" className="block text-center text-sm text-sea underline">
            View full reputation rankings
          </Link>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-deep/5 pb-2 last:border-0">
      <span className="text-slate">{label}</span>
      <span className="font-medium text-deep">{value}</span>
    </div>
  );
}
