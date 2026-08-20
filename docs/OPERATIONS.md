# Operations

How to run and recover TrustMesh on Stellar Testnet.

## Environments

| Piece | Value |
|---|---|
| Network | Stellar Testnet |
| RPC | `https://soroban-testnet.stellar.org` |
| Live IDs | `deployments/testnet.json`, `frontend/public/contracts.json`, `frontend/src/lib/contracts.config.ts` |
| App | https://trust-mesh-taupe.vercel.app/ |

## Redeploy contracts

```bash
stellar keys fund deployer --network testnet
# Windows
.\scripts\deploy.ps1 -Source deployer -Network testnet
# Unix
bash scripts/deploy.sh --source deployer --network testnet
```

Then refresh:

1. `deployments/testnet.env` → `frontend/.env.local`
2. `frontend/public/contracts.json`
3. `frontend/src/lib/contracts.config.ts`

## Admin actions

Admin address matches the deployer that initialized the contracts (`NEXT_PUBLIC_ADMIN_ADDRESS`).

Typical admin-only invokes:

- `verify_organization`
- `verify_review` / `reject_review`
- `resolve_dispute`
- `set_authorized` on reputation / treasury

## Friendbot / unfunded wallets

If the UI shows “account not funded”, use the in-app **Add free Testnet funds** button or:

`https://friendbot.stellar.org/?addr=G...`

Ignore HTTP 400 when the account is already funded.

## Analytics & monitoring

| Tool | Default | Env |
|---|---|---|
| Product events | Browser `localStorage` | optional `NEXT_PUBLIC_POSTHOG_*` |
| Incidents | Browser `localStorage` | optional `NEXT_PUBLIC_SENTRY_DSN` |
| Feedback | Browser `localStorage` | — |

No remote tools run unless env keys are set. See `docs/ANALYTICS.md` and `docs/MONITORING.md`.

## RPC retention

`/activity` reads recent events via RPC `getEvents`. History is limited; treat it as a recent stream, not an archive. Dashboard counts come from current contract storage reads.
