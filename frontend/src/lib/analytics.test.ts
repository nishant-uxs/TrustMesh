import { describe, expect, it } from "vitest";
import {
  PRODUCT_EVENTS,
  sanitizeAnalyticsProps,
  summarizeProductEvents,
  type ProductEvent,
} from "./analytics";

describe("sanitizeAnalyticsProps", () => {
  it("redacts full Stellar addresses", () => {
    const addr = "GC5VBHY5DWV7NTL4PCQL3XGOE4FY2DJHM2JYLRC6YS2IHYTPDZ4DOFIU";
    const out = sanitizeAnalyticsProps({ wallet: addr, action: "register" });
    expect(out?.wallet).toBe("GC5V…OFIU");
    expect(out?.action).toBe("register");
  });

  it("drops secret-like keys", () => {
    const out = sanitizeAnalyticsProps({
      seed: "secret",
      privateKey: "nope",
      count: 2,
    });
    expect(out).toEqual({ count: 2 });
  });
});

describe("summarizeProductEvents", () => {
  it("counts known events and ignores gaps", () => {
    const events: ProductEvent[] = [
      { name: "wallet_connected", at: 1 },
      { name: "wallet_connected", at: 2 },
      { name: "organization_created", at: 3 },
    ];
    const counts = summarizeProductEvents(events);
    expect(counts.wallet_connected).toBe(2);
    expect(counts.organization_created).toBe(1);
    expect(counts.review_submitted).toBe(0);
    expect(Object.keys(counts).sort()).toEqual([...PRODUCT_EVENTS].sort());
  });
});
