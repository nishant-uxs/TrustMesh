"use client";

import { useMemo, useState } from "react";
import {
  DEMO_ORGS,
  DEMO_RELATIONSHIPS,
  DEMO_REPUTATION,
  DEMO_REVIEWS,
} from "@/lib/demo-data";
import type { Organization, Relationship, ReputationScore, Review } from "@/lib/types";

export function useTrustData() {
  const [orgs] = useState<Organization[]>(DEMO_ORGS);
  const [relationships] = useState<Relationship[]>(DEMO_RELATIONSHIPS);
  const [reviews] = useState<Review[]>(DEMO_REVIEWS);
  const [reputation] = useState<Record<number, ReputationScore>>(DEMO_REPUTATION);

  const stats = useMemo(() => {
    const verifiedOrgs = orgs.filter((o) => o.verified).length;
    const activeRels = relationships.filter((r) => r.status === "Active").length;
    const completedRels = relationships.filter((r) => r.status === "Completed").length;
    const verifiedReviews = reviews.filter((r) => r.status === "Verified").length;
    const disputes = relationships.filter((r) => r.status === "Disputed").length;
    const avgTrust =
      orgs.reduce((sum, o) => sum + (o.trustScore || 0), 0) / Math.max(orgs.length, 1);
    return {
      totalOrgs: orgs.length,
      verifiedOrgs,
      activeRels,
      completedRels,
      verifiedReviews,
      disputes,
      avgTrust: Math.round(avgTrust),
    };
  }, [orgs, relationships, reviews]);

  return { orgs, relationships, reviews, reputation, stats };
}
