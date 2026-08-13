import { describe, expect, it } from "vitest";
import {
  getCachedTrustGraph,
  invalidateTrustGraph,
  setCachedTrustGraph,
  withTrustGraphCache,
  type TrustGraph,
} from "./graphCache";

const empty: TrustGraph = {
  orgs: [],
  relationships: [],
  reviews: [],
  reputation: {},
};

describe("trust graph cache", () => {
  it("returns null when empty", () => {
    invalidateTrustGraph();
    expect(getCachedTrustGraph()).toBeNull();
  });

  it("hits cache within TTL", () => {
    invalidateTrustGraph();
    setCachedTrustGraph(empty);
    expect(getCachedTrustGraph()).toEqual(empty);
  });

  it("dedupes in-flight loaders", async () => {
    invalidateTrustGraph();
    let calls = 0;
    const loader = async () => {
      calls += 1;
      return empty;
    };
    const [a, b] = await Promise.all([
      withTrustGraphCache(loader),
      withTrustGraphCache(loader),
    ]);
    expect(a).toEqual(empty);
    expect(b).toEqual(empty);
    expect(calls).toBe(1);
  });
});
