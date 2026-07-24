"use client";

import { useMemo, useState } from "react";
import type { Organization, Relationship, ReputationScore, Review } from "@/lib/types";

/**
 * On-chain trust graph state.
 * Starts empty — data appears only after real contract reads / user actions.
 */
export function useTrustData() {
  const [orgs] = useState<Organization[]>([]);
  const [relationships] = useState<Relationship[]>([]);
  const [reviews] = useState<Review[]>([]);
  const [reputation] = useState<Record<number, ReputationScore>>({});

  const stats = useMemo(() => {
    const verifiedOrgs = orgs.filter((o) => o.verified).length;
    const activeRels = relationships.filter((r) => r.status === "Active").length;
    const completedRels = relationships.filter((r) => r.status === "Completed").length;
    const verifiedReviews = reviews.filter((r) => r.status === "Verified").length;
    const disputes = relationships.filter((r) => r.status === "Disputed").length;
    const avgTrust =
      orgs.length === 0
        ? 0
        : Math.round(
            orgs.reduce((sum, o) => sum + (o.trustScore || 0), 0) / orgs.length,
          );
    return {
      totalOrgs: orgs.length,
      verifiedOrgs,
      activeRels,
      completedRels,
      verifiedReviews,
      disputes,
      avgTrust,
    };
  }, [orgs, relationships, reviews]);

  return { orgs, relationships, reviews, reputation, stats };
}
