# TrustMesh

> Decentralized Business Trust & Reputation Network on Stellar Soroban.

**Stellar Journey to Mastery — Level 3 Orange Belt submission.**

TrustMesh lets businesses, startups, agencies, freelancers, vendors, and service providers establish **verifiable trust** through completed projects, business relationships, verified reviews, dispute history, reputation scores, and immutable on-chain records.

This is **not** crowdfunding, escrow, NFTs, a DAO, CRM, or LinkedIn — it is decentralized trust infrastructure.

[![CI](https://github.com/agarwalnishant812/trustmesh/actions/workflows/ci.yml/badge.svg)](https://github.com/agarwalnishant812/trustmesh/actions/workflows/ci.yml)

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     Next.js Frontend (TypeScript + Tailwind)             │
│  Wallet Kit → Contract calls → RPC getEvents activity stream (5s poll)   │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │
     ┌───────────────────────────┼───────────────────────────┐
     ▼                           ▼                           ▼
┌──────────────┐   ┌─────────────────────┐   ┌──────────────────────┐
│ Organization │   │ Trust Relationship  │   │ Review Verification  │
│ Registry     │◄──│ Factory             │──►│                      │
└──────┬───────┘   └──────────┬──────────┘   └──────────┬───────────┘
       │                      │                         │
       │           ┌──────────▼──────────┐              │
       │           │ Trust Relationship  │──────────────┤
       │           └──────────┬──────────┘              │
       │                      │                         │
       │           ┌──────────▼──────────┐   ┌──────────▼───────────┐
       └──────────►│ Reputation          │◄──┤ Treasury (fees)      │
                   └─────────────────────┘   └──────────────────────┘
```

### Cross-contract communication

| Caller | Callee | Purpose |
|---|---|---|
| Factory | Organization Registry | Validate org ownership before creating a relationship |
| Factory | Trust Relationship | Create relationship records |
| Factory | Reputation | Ensure both orgs are reputation-tracked |
| Factory | Treasury | Record relationship platform fee |
| Trust Relationship | Reputation | Update scores on completion / dispute resolution |
| Review Verification | Organization Registry | Validate reviewer ownership |
| Review Verification | Reputation | Apply verified review ratings |
| Review Verification | Treasury | Record review platform fee |

### Events streamed to the UI

`OrganizationRegistered` · `OrganizationVerified` · `RelationshipCreated` · `RelationshipCompleted` · `ReviewSubmitted` · `ReviewVerified` · `ReputationUpdated` · `TrustScoreUpdated` · `DisputeOpened` · `DisputeResolved`

---

## Deployed contracts (Stellar Testnet)

| Contract | Address | Explorer |
|---|---|---|
| Organization Registry | `CD6AAYZ7IVW6SQDP6NRKRZ3QIRQQPB3ZDRKTSA7ZBU2VRWN4VM4ZNRZT` | [view](https://stellar.expert/explorer/testnet/contract/CD6AAYZ7IVW6SQDP6NRKRZ3QIRQQPB3ZDRKTSA7ZBU2VRWN4VM4ZNRZT) |
| Reputation | `CDYSM4LG4OUPSXGDDSJMZK7H532223GNBAF6I5RAYAFG74HD5QRPRBL5` | [view](https://stellar.expert/explorer/testnet/contract/CDYSM4LG4OUPSXGDDSJMZK7H532223GNBAF6I5RAYAFG74HD5QRPRBL5) |
| Treasury | `CA63C3PLR2GQRNLES6JO72YPFO6HWUYLVWFPZBNY47BRZPYSPUGWMONH` | [view](https://stellar.expert/explorer/testnet/contract/CA63C3PLR2GQRNLES6JO72YPFO6HWUYLVWFPZBNY47BRZPYSPUGWMONH) |
| Trust Relationship | `CBCTIWGKIIGMDMJNPGT4OLVITGTVTW3JFTMHKYBOT42ENZZWEITJLDXJ` | [view](https://stellar.expert/explorer/testnet/contract/CBCTIWGKIIGMDMJNPGT4OLVITGTVTW3JFTMHKYBOT42ENZZWEITJLDXJ) |
| Trust Relationship Factory | `CBF5KOXX34HEF3Q6ECLWQY543V53HJRJ25W5X3DO6O2XII4GP2FHJGHK` | [view](https://stellar.expert/explorer/testnet/contract/CBF5KOXX34HEF3Q6ECLWQY543V53HJRJ25W5X3DO6O2XII4GP2FHJGHK) |
| Review Verification | `CBXOCI2BQTCDUJOVJCAC7TQLBA5HNGVU7UQ5JDLJF44ZHOZBG4PLJ3KF` | [view](https://stellar.expert/explorer/testnet/contract/CBXOCI2BQTCDUJOVJCAC7TQLBA5HNGVU7UQ5JDLJF44ZHOZBG4PLJ3KF) |

### Verifiable sample flow

| Action | Tx |
|---|---|
| `register_organization` → `OrganizationRegistered` | [`fa96bc2e…0a24`](https://stellar.expert/explorer/testnet/tx/fa96bc2eefc492914cfd0641a667fb0df03b0be12ba3c3a97e67dcd5cd960a24) |
| `verify_organization` → `OrganizationVerified` | [`be97ac73…8d76`](https://stellar.expert/explorer/testnet/tx/be97ac73cf039396e1957ea0fdfa88ed328586cccc1c6ec02c985ffefc608d76) |

Full deploy + init hashes: [`deployments/TRANSACTIONS.md`](./deployments/TRANSACTIONS.md)

---

## Features

- Organization onboarding & vendor registration
- Business relationship lifecycle (create → accept → complete / dispute)
- Verified reviews with reputation updates
- Trust scores & public organization profiles
- Live activity timeline from contract events
- Analytics dashboard
- Multi-wallet authentication (Freighter, xBull, Albedo, LOBSTR, Hana)
- Responsive desktop / tablet / mobile UI
- Structured loading states & classified error handling

---

## Tech stack

| Layer | Tech |
|---|---|
| Contracts | Rust + soroban-sdk 25 |
| Build / deploy | stellar-cli 25 + `scripts/deploy.sh` |
| Frontend | Next.js 15 + TypeScript + Tailwind CSS 4 |
| Wallets | `@creit.tech/stellar-wallets-kit` |
| RPC | `@stellar/stellar-sdk` → `soroban-testnet.stellar.org` |
| Tests | cargo test (33) · Vitest (frontend) |
| CI/CD | GitHub Actions |

---

## Quick start

### Prerequisites

- Node.js ≥ 20
- Rust + `wasm32v1-none` target
- stellar-cli ≥ 22
- Funded Testnet identity: `stellar keys generate trustmesh-admin --network testnet --fund`

### Contracts

```bash
cargo test --workspace
stellar contract build
./scripts/deploy.sh --source trustmesh-admin --network testnet
```

### Frontend

```bash
cd frontend
cp .env.example .env.local   # or copy deployments/testnet.env
npm install
npm test
npm run dev
```

Open http://localhost:3000

### Production build

```bash
cd frontend && npm run build && npm start
```

---

## Project structure

```
.
├── contracts/
│   ├── organization_registry/
│   ├── reputation/
│   ├── treasury/
│   ├── trust_relationship/
│   ├── trust_relationship_factory/
│   └── review_verification/
├── frontend/                 Next.js app
├── scripts/deploy.sh         One-shot Testnet deploy + init + auth wiring
├── deployments/              Generated addresses & tx hashes
└── .github/workflows/ci.yml
```

---

## Orange Belt checklist

- [x] Advanced Soroban smart contracts (auth, state machines, scoring)
- [x] Multiple smart contracts (6)
- [x] Contract-to-contract communication
- [x] Event streaming (RPC `getEvents` → live activity feed)
- [x] Production architecture
- [x] Responsive frontend + mobile support
- [x] Error handling + loading states
- [x] Smart contract testing
- [x] Frontend testing
- [x] CI/CD (GitHub Actions)
- [x] Deployment scripts
- [x] Production documentation
- [x] Stellar Testnet deployment artifacts

---

## License

MIT
