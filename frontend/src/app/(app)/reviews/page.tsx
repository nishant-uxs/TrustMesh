"use client";

import { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Badge } from "@/components/ui/Badge";
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
  const { reviews, orgs } = useTrustData();
  const { address, connect } = useWallet();
  const [reviewerOrg, setReviewerOrg] = useState(1);
  const [revieweeOrg, setRevieweeOrg] = useState(2);
  const [relationshipId, setRelationshipId] = useState(1);
  const [rating, setRating] = useState(5);
  const [commentHash, setCommentHash] = useState("sha256:trustmesh-review");
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
    if (!contractsConfigured()) {
      setError(classifyError(new Error("not configured: missing contract")));
      return;
    }
    try {
      setTx({ phase: "signing" });
      const hash = await submitReview(
        address,
        reviewerOrg,
        revieweeOrg,
        relationshipId,
        rating,
        commentHash,
      );
      setTx({ phase: "success", hash });
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
            <span className="text-slate">Your organization</span>
            <select
              value={reviewerOrg}
              onChange={(e) => setReviewerOrg(Number(e.target.value))}
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
            <span className="text-slate">Reviewee</span>
            <select
              value={revieweeOrg}
              onChange={(e) => setRevieweeOrg(Number(e.target.value))}
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
            <span className="text-slate">Relationship ID</span>
            <input
              type="number"
              min={1}
              value={relationshipId}
              onChange={(e) => setRelationshipId(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-deep/15 bg-white px-3 py-2.5"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate">Rating (1–5)</span>
            <input
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
          {reviews.map((review) => (
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
          ))}
        </div>
      </div>
    </div>
  );
}
