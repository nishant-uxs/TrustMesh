import { DEPLOYED_CONTRACTS } from "./contracts.config";

export const NETWORK = {
  name: "TESTNET" as const,
  passphrase: "Test SDF Network ; September 2015",
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "https://soroban-testnet.stellar.org",
  horizonUrl: process.env.NEXT_PUBLIC_HORIZON_URL || "https://horizon-testnet.stellar.org",
  explorerBase: "https://stellar.expert/explorer/testnet",
};

function pickContract(envValue: string | undefined, fallback: string): string {
  const trimmed = (envValue || "").trim();
  if (trimmed.startsWith("C") && trimmed.length >= 56) return trimmed;
  return fallback;
}

export const CONTRACTS = {
  organizationRegistry: pickContract(
    process.env.NEXT_PUBLIC_ORGANIZATION_REGISTRY_ID,
    DEPLOYED_CONTRACTS.organizationRegistry,
  ),
  trustRelationshipFactory: pickContract(
    process.env.NEXT_PUBLIC_TRUST_RELATIONSHIP_FACTORY_ID,
    DEPLOYED_CONTRACTS.trustRelationshipFactory,
  ),
  trustRelationship: pickContract(
    process.env.NEXT_PUBLIC_TRUST_RELATIONSHIP_ID,
    DEPLOYED_CONTRACTS.trustRelationship,
  ),
  reputation: pickContract(process.env.NEXT_PUBLIC_REPUTATION_ID, DEPLOYED_CONTRACTS.reputation),
  reviewVerification: pickContract(
    process.env.NEXT_PUBLIC_REVIEW_VERIFICATION_ID,
    DEPLOYED_CONTRACTS.reviewVerification,
  ),
  treasury: pickContract(process.env.NEXT_PUBLIC_TREASURY_ID, DEPLOYED_CONTRACTS.treasury),
};

export function contractsConfigured(): boolean {
  return Object.values(CONTRACTS).every((v) => v.startsWith("C") && v.length >= 56);
}

export const APP = {
  name: "TrustMesh",
  tagline: "Prove business trust without a middleman",
  description:
    "Register your organization, complete real working relationships, collect verified reviews, and build a public reputation on Stellar Testnet.",
};

export const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_ADDRESS || "";
