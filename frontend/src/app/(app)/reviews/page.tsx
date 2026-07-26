"use client";

import { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Badge, EmptyState, Skeleton } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorBanner, TxStatus } from "@/components/ui/ErrorBanner";
import { useTrustData } from "@/hooks/useTrustData";
import { useWallet } from "@/hooks/useWallet";
import { contractsConfigured } from "@/lib/config";
import { submitReview } from "@/lib/contracts";
import { classifyError } from "@/lib/errors";
import { timeAgo } from "@/lib/format";
import type { TxState } from "@/lib/types";

export default function ReviewsPage() {
  const { reviews, orgs, loading, refresh } = useTrustData();
  const { address, connect } = useWallet();
  const [reviewerOrg, setReviewerOrg] = useState("");
  const [revieweeOrg, setRevieweeOrg] = useState("");
  const [relationshipId, setRelationshipId] = useState("");
  const [rating, setRating] = useState(5);
  const [commentHash, setCommentHash] = useState("");
  const [tx, setTx] = useState<TxState>({ phase: "idle" });
  const [error, setError] = useState<ReturnType<typeof classifyError> | null>(null);

  const orgName = (id: number) => orgs.find((o) => o.id === id)?.name || `Org #${id}`;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!address) {
      await connect();
      return;
    }
    const rOrg = Number(reviewerOrg);
    const vOrg = Number(revieweeOrg);
    const relId = Number(relationshipId);
    if (!rOrg || !vOrg || !relId || !commentHash) {
      setError(classifyError(new Error("contract: complete all review fields")));
      return;
    }
    if (!contractsConfigured()) {
      setError(classifyError(new Error("not configured: missing contract")));
      return;
    }
    try {
      setTx({ phase: "signing" });
      const hash = await submitReview(
        address,
        rOrg,
        vOrg,
        relId,
        rating,
        commentHash,
      );
      setTx({ phase: "success", hash });
      setCommentHash("");
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
        title="Reviews"
        subtitle="Submit relationship-backed reviews. Admin verification updates reputation on-chain."
      />
      <div className="grid gap-8 lg:grid-cols-5">
        <form onSubmit={onSubmit} className="tm-surface space-y-4 rounded-2xl p-5 lg:col-span-2">
          <h2 className="font-display text-xl text-deep">Submit review</h2>
          <label className="block text-sm">
            <span className="text-slate">Your organization ID</span>
            {orgs.length > 0 ? (
              <select
                required
                value={reviewerOrg}
                onChange={(e) => setReviewerOrg(e.target.value)}
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
                value={reviewerOrg}
                onChange={(e) => setReviewerOrg(e.target.value)}
                className="mt-1 w-full rounded-xl border border-deep/15 bg-white px-3 py-2.5"
              />
            )}
          </label>
          <label className="block text-sm">
            <span className="text-slate">Reviewee organization ID</span>
            {orgs.length > 0 ? (
              <select
                required
                value={revieweeOrg}
                onChange={(e) => setRevieweeOrg(e.target.value)}
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
                value={revieweeOrg}
                onChange={(e) => setRevieweeOrg(e.target.value)}
                className="mt-1 w-full rounded-xl border border-deep/15 bg-white px-3 py-2.5"
              />
            )}
          </label>
          <label className="block text-sm">
            <span className="text-slate">Relationship ID</span>
            <input
              required
              type="number"
              min={1}
              value={relationshipId}
              onChange={(e) => setRelationshipId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-deep/15 bg-white px-3 py-2.5"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate">Rating (1–5)</span>
            <input
              required
              type="number"
              min={1}
              max={5}
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-deep/15 bg-white px-3 py-2.5"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate">Comment hash</span>
            <input
              required
              minLength={8}
              value={commentHash}
              onChange={(e) => setCommentHash(e.target.value)}
              className="mt-1 w-full rounded-xl border border-deep/15 bg-white px-3 py-2.5"
            />
          </label>
          <Button type="submit" className="w-full" loading={tx.phase === "signing"}>
            Submit review
          </Button>
          <TxStatus phase={tx.phase} hash={tx.hash} />
          {error && <ErrorBanner error={error} onDismiss={() => setError(null)} />}
        </form>

        <div className="space-y-3 lg:col-span-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))
          ) : reviews.length === 0 ? (
            <div className="tm-surface rounded-2xl">
              <EmptyState
                title="No reviews yet"
                description="Verified and submitted reviews from the chain will show here."
              />
            </div>
          ) : (
            reviews.map((review) => (
              <article key={review.id} className="tm-surface rounded-2xl p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-deep">
                    {orgName(review.reviewerOrg)} → {orgName(review.revieweeOrg)}
                  </p>
                  <Badge
                    tone={
                      review.status === "Verified"
                        ? "success"
                        : review.status === "Rejected"
                          ? "danger"
                          : "warn"
                    }
                  >
                    {review.status}
                  </Badge>
                </div>
                <p className="mt-2 text-2xl text-amber">{"★".repeat(review.rating)}</p>
                <p className="mt-1 font-mono text-xs text-slate">{review.commentHash}</p>
                <p className="mt-2 text-xs text-slate">{timeAgo(review.submittedAt)}</p>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
