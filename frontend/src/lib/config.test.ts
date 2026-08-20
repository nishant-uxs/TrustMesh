import { describe, expect, it } from "vitest";
import { contractsConfigured, CONTRACTS, NETWORK } from "./config";
import { DEPLOYED_CONTRACTS } from "./contracts.config";

describe("config", () => {
  it("falls back to deployed Testnet IDs when env is empty", () => {
    expect(contractsConfigured()).toBe(true);
    expect(CONTRACTS.organizationRegistry).toBe(DEPLOYED_CONTRACTS.organizationRegistry);
    expect(CONTRACTS.treasury).toBe(DEPLOYED_CONTRACTS.treasury);
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

  it("targets Stellar Testnet", () => {
    expect(NETWORK.name).toBe("TESTNET");
    expect(NETWORK.passphrase).toContain("Test SDF Network");
  });
});
