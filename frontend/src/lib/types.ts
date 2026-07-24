export type OrgType =
  | "Business"
  | "Startup"
  | "Agency"
  | "Freelancer"
  | "Vendor"
  | "ServiceProvider";

export type RelationshipStatus =
  | "Pending"
  | "Active"
  | "Completed"
  | "Disputed"
  | "Cancelled";

export type ReviewStatus = "Submitted" | "Verified" | "Rejected";

export interface Organization {
  id: number;
  owner: string;
  name: string;
  orgType: OrgType;
  metadataUri: string;
  verified: boolean;
  registeredAt: number;
  vendorCount: number;
  trustScore?: number;
}

export interface Relationship {
  id: number;
  partyA: string;
  partyB: string;
  orgA: number;
  orgB: number;
  title: string;
  status: RelationshipStatus;
  aAccepted: boolean;
  bAccepted: boolean;
  aCompleted: boolean;
  bCompleted: boolean;
  createdAt: number;
  completedAt: number;
  disputeReason: string;
  qualityScore: number;
}

export interface Review {
  id: number;
  reviewer: string;
  reviewerOrg: number;
  revieweeOrg: number;
  relationshipId: number;
  rating: number;
  commentHash: string;
  status: ReviewStatus;
  submittedAt: number;
  verifiedAt: number;
}

export interface ReputationScore {
  orgId: number;
  trustScore: number;
  completedRelationships: number;
  verifiedReviews: number;
  averageRatingBps: number;
  disputesOpened: number;
  disputesLost: number;
  lastUpdated: number;
}

export interface ActivityEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  txHash?: string;
  ledger?: number;
  timestamp: number;
  contractId?: string;
}

export type TxPhase =
  | "idle"
  | "simulating"
  | "signing"
  | "submitted"
  | "success"
  | "failed";

export interface TxState {
  phase: TxPhase;
  hash?: string;
  error?: string;
  message?: string;
}
