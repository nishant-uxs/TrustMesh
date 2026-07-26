"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { contractsConfigured } from "@/lib/config";
import { loadTrustGraph } from "@/lib/contracts";
import { averageTrust } from "@/lib/graph";
import type { Organization, Relationship, ReputationScore, Review } from "@/lib/types";

/**
 * Loads the TrustMesh graph from Soroban read simulations.
 * Starts empty and refreshes from Testnet when contracts are configured.
 */
export function useTrustData() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reputation, setReputation] = useState<Record<number, ReputationScore>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!contractsConfigured()) {
      setOrgs([]);
      setRelationships([]);
      setReviews([]);
      setReputation({});
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    try {
      const graph = await loadTrustGraph(50);
      setOrgs(graph.orgs);
      setRelationships(graph.relationships);
      setReviews(graph.reviews);
      setReputation(graph.reputation);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load on-chain data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 20_000);
    return () => clearInterval(id);
  }, [refresh]);

  const stats = useMemo(() => {
    const verifiedOrgs = orgs.filter((o) => o.verified).length;
    const activeRels = relationships.filter((r) => r.status === "Active").length;
    const completedRels = relationships.filter((r) => r.status === "Completed").length;
    const verifiedReviews = reviews.filter((r) => r.status === "Verified").length;
    const disputes = relationships.filter((r) => r.status === "Disputed").length;
    const avgTrust = averageTrust(orgs);
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

  return {
    orgs,
    relationships,
    reviews,
    reputation,
    stats,
    loading,
    error,
    refresh,
  };
}
