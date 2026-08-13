import type { Organization, Relationship, ReputationScore, Review } from "./types";

export type TrustGraph = {
  orgs: Organization[];
  relationships: Relationship[];
  reviews: Review[];
  reputation: Record<number, ReputationScore>;
};

const TTL_MS = 12_000;

let cached: { at: number; data: TrustGraph } | null = null;
let inflight: Promise<TrustGraph> | null = null;

export function getCachedTrustGraph(): TrustGraph | null {
  if (!cached) return null;
  if (Date.now() - cached.at > TTL_MS) return null;
  return cached.data;
}

export function setCachedTrustGraph(data: TrustGraph): void {
  cached = { at: Date.now(), data };
}

export function invalidateTrustGraph(): void {
  cached = null;
}

export async function withTrustGraphCache(
  loader: () => Promise<TrustGraph>,
  opts?: { force?: boolean },
): Promise<TrustGraph> {
  if (!opts?.force) {
    const hit = getCachedTrustGraph();
    if (hit) return hit;
    if (inflight) return inflight;
  }
  inflight = loader()
    .then((data) => {
      setCachedTrustGraph(data);
      return data;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}
