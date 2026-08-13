# Green Belt gap analysis (internal)

Audited 2026-08-13 against the existing Orange Belt TrustMesh repo. Contracts, CI, wallet writes, and empty-by-default UI already meet a large share of Green Belt. Work below **extends** that foundation — it does not replace it.

## Already satisfied

| Requirement | Existing evidence |
|---|---|
| End-to-end Testnet workflow | Register / create / accept / complete / review via Freighter |
| Wallet connect | Stellar Wallets Kit (Freighter, xBull, LOBSTR, Albedo, Hana, Rabet) |
| Smart contract quality | 6 Soroban crates, auth gates, 39 tests |
| Event streaming | RPC `getEvents` → Activity feed |
| Error classification | `AppError` + human copy (technical details hidden by default) |
| Loading / empty states | Skeletons, empty lists, no fake seed data |
| Mobile layout | Responsive shell, landing, tap targets |
| CI/CD | WASM + lint + typecheck + test + build + deploy gate |
| Testnet deploy | `deployments/testnet.json` + live Vercel |

## Gaps closed in this evolution

1. **First-time onboarding** — role, org creation, human-language steps, Friendbot funding
2. **Product analytics** — privacy-first local events + optional PostHog (no fake metrics)
3. **Error monitoring** — local incident log + optional Sentry DSN
4. **Performance** — shared trust-graph provider, TTL cache, skip redundant score reads, pause polling when tab hidden
5. **Transaction UX** — shared signed-action runner, success/next-step copy, recovery (fund / retry)
6. **Documentation & evidence templates** — Green Belt README, analytics/monitoring docs, real-user log template

## Non-goals (preserve)

- Do not rewrite the six contracts unless a security bug is found
- Do not invent users, txs, or analytics
- Do not weaken CI
