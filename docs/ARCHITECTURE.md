# TrustMesh Architecture

## Smart contract responsibilities

| Contract | Responsibility |
|---|---|
| `organization_registry` | Organization onboarding, verification, vendor registration |
| `trust_relationship_factory` | Entry point for creating relationships; validates orgs; records fees |
| `trust_relationship` | Relationship lifecycle, disputes, completion; updates reputation |
| `reputation` | Trust score accounting from reviews, completions, and disputes |
| `review_verification` | Review submission + admin verification; feeds reputation |
| `treasury` | Platform fee config, deposit/withdraw, fee event accounting |

## Authorization model

1. Each contract has an `admin` set at `initialize`.
2. Reputation and Treasury maintain an `Authorized(Address)` allow-list.
3. Factory, Trust Relationship, and Review Verification are authorized after deploy.
4. Cross-contract callers pass their own contract address as `caller`; Soroban contract identity satisfies `require_auth`.

## Event topics

Events use descriptive topic symbols (e.g. `OrganizationRegistered`) so the frontend can filter via RPC `getEvents` and render a live activity timeline.

## Frontend data strategy

- When contract IDs are configured, the console loads organizations, relationships, reviews, and reputation via Soroban read simulations (`loadTrustGraph`).
- Writes (register / create / accept / complete / review) go on-chain through Freighter-signed invokes.
- The activity feed polls Testnet `getEvents`.
- When contract IDs are missing, lists stay empty (no seed / fake balances).
