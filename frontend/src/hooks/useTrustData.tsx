"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { contractsConfigured } from "@/lib/config";
import { loadTrustGraph } from "@/lib/contracts";
import { classifyError } from "@/lib/errors";
import { averageTrust } from "@/lib/graph";
import type { Organization, Relationship, ReputationScore, Review } from "@/lib/types";

interface TrustDataValue {
  orgs: Organization[];
  relationships: Relationship[];
  reviews: Review[];
  reputation: Record<number, ReputationScore>;
  stats: {
    totalOrgs: number;
    verifiedOrgs: number;
    activeRels: number;
    completedRels: number;
    verifiedReviews: number;
    disputes: number;
    avgTrust: number;
  };
  loading: boolean;
  error: string | null;
  refresh: (force?: boolean) => Promise<void>;
}

const TrustDataContext = createContext<TrustDataValue | null>(null);

export function TrustDataProvider({ children }: { children: ReactNode }) {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reputation, setReputation] = useState<Record<number, ReputationScore>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const refresh = useCallback(async (force = false) => {
    if (!contractsConfigured()) {
      setOrgs([]);
      setRelationships([]);
      setReviews([]);
      setReputation({});
      setLoading(false);
      setError(null);
      return;
    }
    if (!loadedRef.current || force) setLoading(true);
    try {
      const graph = await loadTrustGraph(50, { force });
      setOrgs(graph.orgs);
      setRelationships(graph.relationships);
      setReviews(graph.reviews);
      setReputation(graph.reputation);
      setError(null);
      loadedRef.current = true;
    } catch (err) {
      setError(classifyError(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();

    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 45_000);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(id);
    };
  }, [refresh]);

  const stats = useMemo(() => {
    const verifiedOrgs = orgs.filter((o) => o.verified).length;
    const activeRels = relationships.filter((r) => r.status === "Active").length;
    const completedRels = relationships.filter((r) => r.status === "Completed").length;
    const verifiedReviews = reviews.filter((r) => r.status === "Verified").length;
    const disputes = relationships.filter((r) => r.status === "Disputed").length;
    return {
      totalOrgs: orgs.length,
      verifiedOrgs,
      activeRels,
      completedRels,
      verifiedReviews,
      disputes,
      avgTrust: averageTrust(orgs),
    };
  }, [orgs, relationships, reviews]);

  const value = useMemo(
    () => ({
      orgs,
      relationships,
      reviews,
      reputation,
      stats,
      loading,
      error,
      refresh,
    }),
    [orgs, relationships, reviews, reputation, stats, loading, error, refresh],
  );

  return <TrustDataContext.Provider value={value}>{children}</TrustDataContext.Provider>;
}

export function useTrustData(): TrustDataValue {
  const ctx = useContext(TrustDataContext);
  if (!ctx) {
    throw new Error("useTrustData must be used within TrustDataProvider");
  }
  return ctx;
}
