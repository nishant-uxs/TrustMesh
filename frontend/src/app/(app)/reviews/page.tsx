"use client";

import { useMemo, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { toast } from "@/components/providers/ToastProvider";
import { Badge, EmptyState, Skeleton } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorBanner, TxStatus } from "@/components/ui/ErrorBanner";
import { Pagination, SearchFilters } from "@/components/ui/SearchFilters";
import { useTrustData } from "@/hooks/useTrustData";
import { useWallet } from "@/hooks/useWallet";
import { ADMIN_ADDRESS, contractsConfigured } from "@/lib/config";
import { submitReview, verifyReview } from "@/lib/contracts";
import { classifyError } from "@/lib/errors";
import { timeAgo } from "@/lib/format";
import { runSignedAction } from "@/lib/tx";
import { track } from "@/lib/analyticsClient";
import type { TxState } from "@/lib/types";

const PAGE_SIZE = 6;

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
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);

  const orgName = (id: number) => orgs.find((o) => o.id === id)?.name || `Org #${id}`;

  const filtered = useMemo(() => {
    const nameOf = (id: number) => orgs.find((o) => o.id === id)?.name || `Org #${id}`;
    const q = query.trim().toLowerCase();
    return reviews.filter((review) => {
      if (filter !== "all" && review.status.toLowerCase() !== filter) return false;
      if (!q) return true;
      return (
        nameOf(review.reviewerOrg).toLowerCase().includes(q) ||
        nameOf(review.revieweeOrg).toLowerCase().includes(q) ||
        review.commentHash.toLowerCase().includes(q) ||
        String(review.id).includes(q)
      );
    });
  }, [reviews, query, filter, orgs]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const isAdmin = Boolean(address && ADMIN_ADDRESS && address === ADMIN_ADDRESS);

  async function onVerify(reviewId: number) {
    if (!address) {
      await connect();
      return;
    }
    const result = await runSignedAction(
      "verify_review",
      () => verifyReview(address, reviewId),
      (phase, extra) => setTx({ phase, hash: extra?.hash, error: extra?.error }),
    );
    if (!result.ok) {
      setError(result.error);
      toast.error(result.error.message);
      return;
    }
    track("review_verified");
    toast.success("Review verified. Reputation updated.");
    await refresh(true);
  }

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
    const result = await runSignedAction(
      "submit_review",
      () => submitReview(address, rOrg, vOrg, relId, rating, commentHash),
      (phase, extra) => setTx({ phase, hash: extra?.hash, error: extra?.error }),
    );
    if (!result.ok) {
      setError(result.error);
      toast.error(result.error.message);
      return;
    }
    track("review_submitted");
    toast.success("Review submitted. An admin can verify it to update reputation.");
    setCommentHash("");
    await refresh(true);
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
          {error && <ErrorBanner error={error} address={address} onDismiss={() => setError(null)} />}
        </form>

        <div className="space-y-4 lg:col-span-3">
          <SearchFilters
            placeholder="Search reviews…"
            filters={[
              { label: "All", value: "all" },
              { label: "Pending", value: "pending" },
              { label: "Verified", value: "verified" },
              { label: "Rejected", value: "rejected" },
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
              <Skeleton key={i} className="h-24 w-full" />
            ))
          ) : pageItems.length === 0 ? (
            <div className="tm-surface rounded-2xl">
              <EmptyState
                title="No reviews yet"
                description="Verified and submitted reviews from the chain will show here."
              />
            </div>
          ) : (
            pageItems.map((review) => (
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
                {isAdmin && review.status === "Submitted" && (
                  <Button className="mt-3" size="sm" onClick={() => void onVerify(review.id)}>
                    Verify review
                  </Button>
                )}
              </article>
            ))
          )}
          <Pagination page={page} pageCount={pageCount} onChange={setPage} />
        </div>
      </div>
    </div>
  );
}
