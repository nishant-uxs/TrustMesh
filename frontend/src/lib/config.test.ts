import { describe, expect, it } from "vitest";
import { contractsConfigured, CONTRACTS } from "./config";

describe("config", () => {
  it("reports contracts as unconfigured by default in tests", () => {
    expect(contractsConfigured()).toBe(false);
  });

  it("exposes all six contract slots", () => {
    expect(Object.keys(CONTRACTS)).toEqual([
      "organizationRegistry",
      "trustRelationshipFactory",
      "trustRelationship",
      "reputation",
      "reviewVerification",
      "treasury",
    ]);
  });
});
