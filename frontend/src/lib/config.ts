export const NETWORK = {
  name: "TESTNET" as const,
  passphrase: "Test SDF Network ; September 2015",
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "https://soroban-testnet.stellar.org",
  horizonUrl: process.env.NEXT_PUBLIC_HORIZON_URL || "https://horizon-testnet.stellar.org",
  explorerBase: "https://stellar.expert/explorer/testnet",
};

export const CONTRACTS = {
  organizationRegistry:
    process.env.NEXT_PUBLIC_ORGANIZATION_REGISTRY_ID || "",
  trustRelationshipFactory:
    process.env.NEXT_PUBLIC_TRUST_RELATIONSHIP_FACTORY_ID || "",
  trustRelationship: process.env.NEXT_PUBLIC_TRUST_RELATIONSHIP_ID || "",
  reputation: process.env.NEXT_PUBLIC_REPUTATION_ID || "",
  reviewVerification: process.env.NEXT_PUBLIC_REVIEW_VERIFICATION_ID || "",
  treasury: process.env.NEXT_PUBLIC_TREASURY_ID || "",
};

export function contractsConfigured(): boolean {
  return Object.values(CONTRACTS).every((v) => v.startsWith("C") && v.length >= 56);
}

export const APP = {
  name: "TrustMesh",
  tagline: "Decentralized business trust on Stellar",
  description:
    "Verify organizations, relationships, reviews, and reputation with immutable on-chain records.",
};
