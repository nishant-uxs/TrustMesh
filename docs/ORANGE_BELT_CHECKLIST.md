# Orange Belt checklist → TrustMesh

| Requirement | Implementation |
|---|---|
| Advanced Soroban contracts | Auth gates, relationship state machine, reputation scoring, fee accounting |
| Multiple contracts | 6 crates under `contracts/` |
| Contract-to-contract calls | Factory → Registry / Relationship / Reputation / Treasury; Relationship → Reputation; Reviews → Registry / Reputation / Treasury |
| Event streaming | Contract events + frontend `getEvents` poll → Activity feed |
| Production architecture | Monorepo, deploy scripts, env-driven contract IDs, classified errors |
| Responsive frontend | Next.js + Tailwind, mobile sidebar, desktop shell |
| Error handling / loading | `AppError` classifier, skeletons, tx phase status, ErrorBoundary |
| Smart contract tests | `cargo test --workspace` (33 tests) |
| Frontend tests | Vitest (`format`, `errors`, `config`) |
| CI/CD | `.github/workflows/ci.yml` |
| Deployment scripts | `scripts/deploy.sh`, `scripts/deploy.ps1` |
| Production docs | README, `docs/ARCHITECTURE.md`, `deployments/TRANSACTIONS.md` |
| Testnet deployment | Addresses + tx hashes in `deployments/` |
