import * as StellarSdk from "@stellar/stellar-sdk";
import { CONTRACTS, NETWORK, contractsConfigured } from "./config";
import { AppError } from "./errors";
import { signTransactionXdr } from "./wallets";

const { Contract, rpc, TransactionBuilder, BASE_FEE, Networks, xdr } = StellarSdk;

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
  buildOps: (account: StellarSdk.Account) => StellarSdk.xdr.Operation[],
): Promise<string> {
  requireContracts();
  const server = getServer();
  const account = await server.getAccount(source);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK.passphrase,
  });

  for (const op of buildOps(account)) {
    tx.addOperation(op);
  }

  const prepared = await server.prepareTransaction(tx.setTimeout(180).build());
  const signed = await signTransactionXdr(prepared.toXDR(), source);
  const parsed = TransactionBuilder.fromXDR(signed, NETWORK.passphrase);
  const result = await server.sendTransaction(parsed);

  if (result.status === "ERROR") {
    throw new Error(`Transaction error: ${JSON.stringify(result.errorResult)}`);
  }

  // Poll until success / failure
  if (result.status === "PENDING") {
    let attempts = 0;
    while (attempts < 20) {
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
  }
  return result.hash;
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
      ...[
        StellarSdk.nativeToScVal(owner, { type: "address" }),
        StellarSdk.nativeToScVal(name, { type: "string" }),
        // OrgType enum — Business = 0 etc; send as symbol variant via map
        StellarSdk.xdr.ScVal.scvVec([
          StellarSdk.xdr.ScVal.scvSymbol(orgType),
        ]),
        StellarSdk.nativeToScVal(metadataUri, { type: "string" }),
      ],
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
      topics.find((t) => EVENT_TOPIC_MAP[t]) ||
      topics[0] ||
      "ContractEvent";
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

// silence unused import warning for Networks/xdr in some SDK trees
void Networks;
void xdr;
