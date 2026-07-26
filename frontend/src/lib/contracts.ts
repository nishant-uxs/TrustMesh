import * as StellarSdk from "@stellar/stellar-sdk";
import { CONTRACTS, NETWORK, contractsConfigured } from "./config";
import { AppError } from "./errors";
import type {
  Organization,
  OrgType,
  Relationship,
  RelationshipStatus,
  ReputationScore,
  Review,
  ReviewStatus,
} from "./types";
import { signTransactionXdr } from "./wallets";
import { rangeIds } from "./graph";

const { Contract, rpc, TransactionBuilder, Account, BASE_FEE } = StellarSdk;

/** Funded Testnet account used only as simulation source for read calls. */
const READ_SOURCE =
  process.env.NEXT_PUBLIC_READ_SOURCE ||
  "GC5VBHY5DWV7NTL4PCQL3XGOE4FY2DJHM2JYLRC6YS2IHYTPDZ4DOFIU";

export function getServer(): InstanceType<typeof rpc.Server> {
  return new rpc.Server(NETWORK.rpcUrl, { allowHttp: false });
}

export function requireContracts(): void {
  if (!contractsConfigured()) {
    throw new AppError(
      "NotConfigured",
      "Contract addresses are not configured. Deploy contracts or set env vars.",
    );
  }
}

async function buildAndSend(
  source: string,
  buildOps: () => StellarSdk.xdr.Operation[],
): Promise<string> {
  requireContracts();
  const server = getServer();
  const account = await server.getAccount(source);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK.passphrase,
  });

  for (const op of buildOps()) {
    tx.addOperation(op);
  }

  const prepared = await server.prepareTransaction(tx.setTimeout(180).build());
  const signed = await signTransactionXdr(prepared.toXDR(), source);
  const parsed = TransactionBuilder.fromXDR(signed, NETWORK.passphrase);
  const result = await server.sendTransaction(parsed);

  if (result.status === "ERROR") {
    throw new Error(`Transaction error: ${JSON.stringify(result.errorResult)}`);
  }

  let attempts = 0;
  while (attempts < 30) {
    await new Promise((r) => setTimeout(r, 2000));
    const get = await server.getTransaction(result.hash);
    if (get.status === rpc.Api.GetTransactionStatus.SUCCESS) {
      return result.hash;
    }
    if (get.status === rpc.Api.GetTransactionStatus.FAILED) {
      throw new Error(`Transaction failed: ${result.hash}`);
    }
    attempts += 1;
  }
  throw new Error(`Transaction still pending after confirmation timeout: ${result.hash}`);
}

async function simulateCall(
  contractId: string,
  method: string,
  ...args: StellarSdk.xdr.ScVal[]
): Promise<unknown> {
  requireContracts();
  const server = getServer();
  const contract = new Contract(contractId);
  let account: StellarSdk.Account;
  try {
    account = await server.getAccount(READ_SOURCE);
  } catch {
    account = new Account(READ_SOURCE, "0");
  }

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK.passphrase,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(60)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(sim.error || `Simulation failed for ${method}`);
  }
  if (!rpc.Api.isSimulationSuccess(sim) || !sim.result) {
    throw new Error(`No result for ${method}`);
  }
  return StellarSdk.scValToNative(sim.result.retval);
}

function asEnumTag(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const keys = Object.keys(value as object);
    if (keys.length) return keys[0];
  }
  return String(value ?? "");
}

function mapOrg(raw: Record<string, unknown>): Organization {
  return {
    id: Number(raw.id),
    owner: String(raw.owner),
    name: String(raw.name),
    orgType: asEnumTag(raw.org_type) as OrgType,
    metadataUri: String(raw.metadata_uri),
    verified: Boolean(raw.verified),
    registeredAt: Number(raw.registered_at),
    vendorCount: Number(raw.vendor_count),
  };
}

function mapRel(raw: Record<string, unknown>): Relationship {
  return {
    id: Number(raw.id),
    partyA: String(raw.party_a),
    partyB: String(raw.party_b),
    orgA: Number(raw.org_a),
    orgB: Number(raw.org_b),
    title: String(raw.title),
    status: asEnumTag(raw.status) as RelationshipStatus,
    aAccepted: Boolean(raw.a_accepted),
    bAccepted: Boolean(raw.b_accepted),
    aCompleted: Boolean(raw.a_completed),
    bCompleted: Boolean(raw.b_completed),
    createdAt: Number(raw.created_at),
    completedAt: Number(raw.completed_at),
    disputeReason: String(raw.dispute_reason || ""),
    qualityScore: Number(raw.quality_score),
  };
}

function mapReview(raw: Record<string, unknown>): Review {
  return {
    id: Number(raw.id),
    reviewer: String(raw.reviewer),
    reviewerOrg: Number(raw.reviewer_org),
    revieweeOrg: Number(raw.reviewee_org),
    relationshipId: Number(raw.relationship_id),
    rating: Number(raw.rating),
    commentHash: String(raw.comment_hash),
    status: asEnumTag(raw.status) as ReviewStatus,
    submittedAt: Number(raw.submitted_at),
    verifiedAt: Number(raw.verified_at),
  };
}

function mapRep(raw: Record<string, unknown>): ReputationScore {
  return {
    orgId: Number(raw.org_id),
    trustScore: Number(raw.trust_score),
    completedRelationships: Number(raw.completed_relationships),
    verifiedReviews: Number(raw.verified_reviews),
    averageRatingBps: Number(raw.average_rating_bps),
    disputesOpened: Number(raw.disputes_opened),
    disputesLost: Number(raw.disputes_lost),
    lastUpdated: Number(raw.last_updated),
  };
}

export async function fetchTotalOrganizations(): Promise<number> {
  const n = await simulateCall(CONTRACTS.organizationRegistry, "total_organizations");
  return Number(n);
}

export async function fetchOrganization(orgId: number): Promise<Organization | null> {
  try {
    const raw = (await simulateCall(
      CONTRACTS.organizationRegistry,
      "get_organization",
      StellarSdk.nativeToScVal(orgId, { type: "u64" }),
    )) as Record<string, unknown>;
    return mapOrg(raw);
  } catch {
    return null;
  }
}

export async function fetchTotalRelationships(): Promise<number> {
  const n = await simulateCall(CONTRACTS.trustRelationship, "total_relationships");
  return Number(n);
}

export async function fetchRelationship(id: number): Promise<Relationship | null> {
  try {
    const raw = (await simulateCall(
      CONTRACTS.trustRelationship,
      "get_relationship",
      StellarSdk.nativeToScVal(id, { type: "u64" }),
    )) as Record<string, unknown>;
    return mapRel(raw);
  } catch {
    return null;
  }
}

export async function fetchTotalReviews(): Promise<number> {
  const n = await simulateCall(CONTRACTS.reviewVerification, "total_reviews");
  return Number(n);
}

export async function fetchReview(id: number): Promise<Review | null> {
  try {
    const raw = (await simulateCall(
      CONTRACTS.reviewVerification,
      "get_review",
      StellarSdk.nativeToScVal(id, { type: "u64" }),
    )) as Record<string, unknown>;
    return mapReview(raw);
  } catch {
    return null;
  }
}

export async function fetchReputation(orgId: number): Promise<ReputationScore | null> {
  try {
    const raw = (await simulateCall(
      CONTRACTS.reputation,
      "get_reputation",
      StellarSdk.nativeToScVal(orgId, { type: "u64" }),
    )) as Record<string, unknown>;
    return mapRep(raw);
  } catch {
    return null;
  }
}

export async function fetchTrustScore(orgId: number): Promise<number> {
  try {
    const n = await simulateCall(
      CONTRACTS.reputation,
      "get_trust_score",
      StellarSdk.nativeToScVal(orgId, { type: "u64" }),
    );
    return Number(n);
  } catch {
    return 0;
  }
}

/** Load recent on-chain graph (capped for RPC budget). */
export async function loadTrustGraph(limit = 40): Promise<{
  orgs: Organization[];
  relationships: Relationship[];
  reviews: Review[];
  reputation: Record<number, ReputationScore>;
}> {
  if (!contractsConfigured()) {
    return { orgs: [], relationships: [], reviews: [], reputation: {} };
  }

  const [orgTotal, relTotal, reviewTotal] = await Promise.all([
    fetchTotalOrganizations().catch(() => 0),
    fetchTotalRelationships().catch(() => 0),
    fetchTotalReviews().catch(() => 0),
  ]);

  const orgIds = rangeIds(orgTotal, limit);
  const relIds = rangeIds(relTotal, limit);
  const reviewIds = rangeIds(reviewTotal, limit);

  const orgs = (
    await Promise.all(orgIds.map((id) => fetchOrganization(id)))
  ).filter((o): o is Organization => Boolean(o));

  const relationships = (
    await Promise.all(relIds.map((id) => fetchRelationship(id)))
  ).filter((r): r is Relationship => Boolean(r));

  const reviews = (
    await Promise.all(reviewIds.map((id) => fetchReview(id)))
  ).filter((r): r is Review => Boolean(r));

  const reputation: Record<number, ReputationScore> = {};
  await Promise.all(
    orgs.map(async (org) => {
      const score = await fetchReputation(org.id);
      const trust = score?.trustScore ?? (await fetchTrustScore(org.id));
      org.trustScore = trust;
      if (score) reputation[org.id] = score;
    }),
  );

  return { orgs, relationships, reviews, reputation };
}

export async function registerOrganization(
  owner: string,
  name: string,
  orgType: string,
  metadataUri: string,
): Promise<string> {
  const contract = new Contract(CONTRACTS.organizationRegistry);
  return buildAndSend(owner, () => [
    contract.call(
      "register_organization",
      StellarSdk.nativeToScVal(owner, { type: "address" }),
      StellarSdk.nativeToScVal(name, { type: "string" }),
      StellarSdk.xdr.ScVal.scvVec([StellarSdk.xdr.ScVal.scvSymbol(orgType)]),
      StellarSdk.nativeToScVal(metadataUri, { type: "string" }),
    ),
  ]);
}

export async function createRelationship(
  creator: string,
  orgA: number,
  orgB: number,
  title: string,
): Promise<string> {
  const contract = new Contract(CONTRACTS.trustRelationshipFactory);
  return buildAndSend(creator, () => [
    contract.call(
      "create_relationship",
      StellarSdk.nativeToScVal(creator, { type: "address" }),
      StellarSdk.nativeToScVal(orgA, { type: "u64" }),
      StellarSdk.nativeToScVal(orgB, { type: "u64" }),
      StellarSdk.nativeToScVal(title, { type: "string" }),
    ),
  ]);
}

export async function submitReview(
  reviewer: string,
  reviewerOrg: number,
  revieweeOrg: number,
  relationshipId: number,
  rating: number,
  commentHash: string,
): Promise<string> {
  const contract = new Contract(CONTRACTS.reviewVerification);
  return buildAndSend(reviewer, () => [
    contract.call(
      "submit_review",
      StellarSdk.nativeToScVal(reviewer, { type: "address" }),
      StellarSdk.nativeToScVal(reviewerOrg, { type: "u64" }),
      StellarSdk.nativeToScVal(revieweeOrg, { type: "u64" }),
      StellarSdk.nativeToScVal(relationshipId, { type: "u64" }),
      StellarSdk.nativeToScVal(rating, { type: "u32" }),
      StellarSdk.nativeToScVal(commentHash, { type: "string" }),
    ),
  ]);
}

export async function acceptRelationship(
  actor: string,
  relationshipId: number,
): Promise<string> {
  const contract = new Contract(CONTRACTS.trustRelationship);
  return buildAndSend(actor, () => [
    contract.call(
      "accept",
      StellarSdk.nativeToScVal(actor, { type: "address" }),
      StellarSdk.nativeToScVal(relationshipId, { type: "u64" }),
    ),
  ]);
}

export async function completeRelationship(
  actor: string,
  relationshipId: number,
  qualityScore: number,
): Promise<string> {
  const contract = new Contract(CONTRACTS.trustRelationship);
  return buildAndSend(actor, () => [
    contract.call(
      "complete",
      StellarSdk.nativeToScVal(actor, { type: "address" }),
      StellarSdk.nativeToScVal(relationshipId, { type: "u64" }),
      StellarSdk.nativeToScVal(qualityScore, { type: "u32" }),
    ),
  ]);
}

export async function openDispute(
  actor: string,
  relationshipId: number,
  reason: string,
): Promise<string> {
  const contract = new Contract(CONTRACTS.trustRelationship);
  return buildAndSend(actor, () => [
    contract.call(
      "open_dispute",
      StellarSdk.nativeToScVal(actor, { type: "address" }),
      StellarSdk.nativeToScVal(relationshipId, { type: "u64" }),
      StellarSdk.nativeToScVal(reason, { type: "string" }),
    ),
  ]);
}

export type RawEvent = {
  id: string;
  type: string;
  contractId: string;
  txHash?: string;
  ledger: number;
  timestamp: number;
  topics: string[];
  value: unknown;
};

const EVENT_TOPIC_MAP: Record<string, string> = {
  OrganizationRegistered: "OrganizationRegistered",
  OrganizationVerified: "OrganizationVerified",
  RelationshipCreated: "RelationshipCreated",
  RelationshipCompleted: "RelationshipCompleted",
  ReviewSubmitted: "ReviewSubmitted",
  ReviewVerified: "ReviewVerified",
  ReputationUpdated: "ReputationUpdated",
  TrustScoreUpdated: "TrustScoreUpdated",
  DisputeOpened: "DisputeOpened",
  DisputeResolved: "DisputeResolved",
};

export async function fetchContractEvents(
  cursorLedger?: number,
): Promise<{ events: RawEvent[]; latestLedger: number }> {
  if (!contractsConfigured()) {
    return { events: [], latestLedger: 0 };
  }

  const server = getServer();
  const latest = await server.getLatestLedger();
  const startLedger = cursorLedger
    ? Math.max(cursorLedger, latest.sequence - 10000)
    : Math.max(1, latest.sequence - 2000);

  const contractIds = Object.values(CONTRACTS).filter(Boolean);
  const response = await server.getEvents({
    startLedger,
    filters: [
      {
        type: "contract",
        contractIds,
      },
    ],
    limit: 100,
  });

  const events: RawEvent[] = response.events.map((ev, idx) => {
    const topics = (ev.topic || []).map((t) => {
      try {
        return StellarSdk.scValToNative(t)?.toString?.() ?? String(t);
      } catch {
        return "unknown";
      }
    });
    const matched =
      topics.find((t) => EVENT_TOPIC_MAP[t]) || topics[0] || "ContractEvent";
    let value: unknown = null;
    try {
      value = StellarSdk.scValToNative(ev.value);
    } catch {
      value = null;
    }
    const contractId =
      typeof ev.contractId === "string"
        ? ev.contractId
        : ev.contractId
          ? String(ev.contractId)
          : "";
    return {
      id: `${ev.txHash || "evt"}-${idx}`,
      type: matched,
      contractId,
      txHash: ev.txHash,
      ledger: ev.ledger,
      timestamp: ev.ledgerClosedAt
        ? Math.floor(new Date(ev.ledgerClosedAt).getTime() / 1000)
        : Math.floor(Date.now() / 1000),
      topics,
      value,
    };
  });

  return { events, latestLedger: latest.sequence };
}
