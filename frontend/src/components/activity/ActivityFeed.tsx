"use client";

import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Badge";
import { useEventStream } from "@/hooks/useEventStream";
import { explorerTxUrl, timeAgo } from "@/lib/format";

const TONE: Record<string, "success" | "warn" | "danger" | "info" | "neutral"> = {
  OrganizationRegistered: "info",
  OrganizationVerified: "success",
  RelationshipCreated: "info",
  RelationshipCompleted: "success",
  ReviewSubmitted: "neutral",
  ReviewVerified: "success",
  ReputationUpdated: "info",
  TrustScoreUpdated: "info",
  DisputeOpened: "danger",
  DisputeResolved: "warn",
};

export function ActivityFeed({ limit = 12 }: { limit?: number }) {
  const { events, live, loading } = useEventStream();

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="mb-2 flex items-center gap-2 text-xs text-slate">
        <span
          className={`h-2 w-2 rounded-full ${live ? "bg-mint animate-pulse-dot" : "bg-slate"}`}
        />
        {live ? "Live event stream" : "Demo activity feed"}
      </div>
      {events.slice(0, limit).map((ev, idx) => (
        <article
          key={ev.id}
          className="tm-surface rounded-2xl p-4 animate-fade-up"
          style={{ animationDelay: `${idx * 40}ms` }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge tone={TONE[ev.type] || "neutral"}>{ev.type}</Badge>
            <time className="text-xs text-slate">{timeAgo(ev.timestamp)}</time>
          </div>
          <h3 className="mt-2 text-sm font-semibold text-deep">{ev.title}</h3>
          <p className="mt-1 text-sm text-slate">{ev.description}</p>
          {ev.txHash && (
            <a
              href={explorerTxUrl(ev.txHash)}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-xs text-sea underline"
            >
              Transaction
            </a>
          )}
        </article>
      ))}
    </div>
  );
}
