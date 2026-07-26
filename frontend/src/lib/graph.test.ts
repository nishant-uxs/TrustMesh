import { describe, expect, it } from "vitest";
import type { Organization } from "./types";
import { averageTrust, rangeIds } from "./graph";

describe("rangeIds", () => {
  it("returns empty for zero total", () => {
    expect(rangeIds(0, 40)).toEqual([]);
  });

  it("returns full range when under limit", () => {
    expect(rangeIds(3, 40)).toEqual([1, 2, 3]);
  });

  it("windows to the newest ids", () => {
    expect(rangeIds(100, 5)).toEqual([96, 97, 98, 99, 100]);
  });
});

describe("averageTrust", () => {
  it("returns 0 for empty list", () => {
    expect(averageTrust([])).toBe(0);
  });

  it("averages trust scores", () => {
    expect(
      averageTrust([
        { trustScore: 100 } as Organization,
        { trustScore: 200 } as Organization,
      ]),
    ).toBe(150);
  });
});
