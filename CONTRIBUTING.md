# Contributing to TrustMesh

Thanks for helping improve TrustMesh.

## Ground rules

- Do not invent on-chain users, balances, analytics, or transaction hashes.
- Do not commit seed phrases, secret keys, or `.env.local` values.
- Keep the console empty-by-default: no fake seed tables.

## Local setup

```bash
make test
make frontend-dev
```

See the root README for contract deploy and frontend env setup.

## Pull requests

- Prefer small, focused changes.
- Run `cargo test --workspace` and `cd frontend && npm run lint && npm run typecheck && npm test` before opening a PR.
- Update docs/evidence only with real Testnet CLI output.
