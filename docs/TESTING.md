# Testing

## Smart contracts

```bash
cargo test --workspace
```

Expect **39** unit tests across six crates covering auth boundaries, happy paths, and rejection cases (duplicate register, self-review, unauthorized verify, etc.).

## Frontend

```bash
cd frontend
npm run lint
npm run typecheck
npm test
npm run build
```

Vitest covers analytics sanitization, error classification, graph helpers, config defaults, and `runSignedAction` phase forwarding.

## CI matrix

`.github/workflows/ci.yml` on `master` / PRs:

1. Contracts — `cargo test --workspace` → WASM build → validate `deployments/testnet.json`
2. Frontend — lint → typecheck → test → production build
3. Deploy gate — Vercel production path confirmation

## Manual Testnet checks

1. Connect Freighter on **Testnet**
2. Register organization → explorer receipt
3. Admin verify (CLI or admin wallet)
4. Create relationship → accept → complete → submit review
5. Confirm Analytics reflects live org counts (product events may stay empty)

Demo scripts (CLI keystore only — never commit secrets):

```bash
node scripts/demo-users.mjs --count 10
node scripts/demo-activity.mjs
```
