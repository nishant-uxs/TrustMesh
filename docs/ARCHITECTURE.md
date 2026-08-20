# TrustMesh Architecture

## Smart contract responsibilities

| Contract | Responsibility |
|---|---|
| `organization_registry` | Organization onboarding, verification, vendor registration |
| `trust_relationship_factory` | Entry point for creating relationships; validates orgs; records fees |
| `trust_relationship` | Relationship lifecycle, disputes, completion; updates reputation |
| `reputation` | Trust score accounting from reviews, completions, and disputes |
| `review_verification` | Review submission + admin verification; feeds reputation |
| `treasury` | Fee config + optional SAC token custody (deposit / fee pull / withdraw / skim) |

## Authorization model

1. Each contract has an `admin` set at `initialize`.
2. Reputation and Treasury maintain an `Authorized(Address)` allow-list.
3. Factory, Trust Relationship, and Review Verification are authorized after deploy.
4. Cross-contract callers pass their own contract address as `caller`; Soroban contract identity satisfies `require_auth`.

## Event topics

Events use descriptive topic symbols (e.g. `OrganizationRegistered`) so the frontend can filter via RPC `getEvents` and render a live activity timeline.

## Frontend data strategy

- `TrustDataProvider` loads the graph once per shell and refreshes in the background (tab must be visible).
- `loadTrustGraph` uses a short TTL cache and coalesces in-flight RPC.
- Reputation scores come from `get_reputation` only (no extra `get_trust_score` round trip).
- Writes go through `runSignedAction` (analytics + monitoring + classified errors).
- Contract IDs default from `contracts.config.ts` / `public/contracts.json`; env vars override.
- When IDs are missing, lists stay empty (no seed / fake balances).

## Signed invoke path

1. `assertWalletOnTestnet` (Freighter network details when available)
2. `simulating` — `prepareTransaction` (Soroban simulation / assembly)
3. `signing` — wallet signs XDR with Testnet passphrase
4. `submitted` — `sendTransaction` returns hash
5. Poll `getTransaction` until SUCCESS / FAILED / timeout
6. Invalidate trust-graph cache on success

UI surfaces these phases via `TxStatus` / `TxPanel`. Wrong-network shows a persistent banner in `AppShell`.
