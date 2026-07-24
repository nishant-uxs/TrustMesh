import { describe, expect, it } from "vitest";
import {
  clsx,
  formatScore,
  ratingFromBps,
  shortenAddress,
  timeAgo,
} from "./format";

describe("shortenAddress", () => {
  it("shortens long addresses", () => {
    expect(shortenAddress("GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCD")).toBe(
      "GABC…ABCD",
    );
  });

  it("returns empty for empty input", () => {
    expect(shortenAddress("")).toBe("");
  });

  it("returns short values unchanged", () => {
    expect(shortenAddress("ABCD")).toBe("ABCD");
  });

  it("respects custom char count", () => {
    expect(shortenAddress("GABCDEFGHIJKLMNOPQRSTUVWXYZ", 6)).toBe("GABCDE…UVWXYZ");
  });
});

describe("timeAgo", () => {
  const now = 1_700_000_000_000;

  it("formats seconds", () => {
    expect(timeAgo(now / 1000 - 12, now)).toBe("12s ago");
  });

  it("formats minutes", () => {
    expect(timeAgo(now / 1000 - 120, now)).toBe("2m ago");
  });

  it("formats hours", () => {
    expect(timeAgo(now / 1000 - 7200, now)).toBe("2h ago");
  });

  it("formats days", () => {
    expect(timeAgo(now / 1000 - 86400 * 3, now)).toBe("3d ago");
  });

  it("handles zero", () => {
    expect(timeAgo(0, now)).toBe("—");
  });
});

describe("format helpers", () => {
  it("formats scores", () => {
    expect(formatScore(842)).toBe("842");
  });

  it("converts rating bps", () => {
    expect(ratingFromBps(460)).toBe("4.6");
    expect(ratingFromBps(0)).toBe("—");
  });

  it("joins class names", () => {
    expect(clsx("a", false, "b", undefined, "c")).toBe("a b c");
  });
});
