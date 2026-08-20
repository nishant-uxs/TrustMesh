# Security policy

## Reporting

If you find a vulnerability in TrustMesh (contracts or frontend), open a private GitHub security advisory on this repository or email the maintainer listed on the GitHub profile. Do not file public issues with exploit details.

## Scope

- Soroban contracts under `contracts/`
- Next.js console under `frontend/`
- Deploy scripts under `scripts/`

## Out of scope

- Stellar Testnet faucet abuse
- Issues that require leaked private keys from a developer machine
- Third-party wallet extension bugs

## Hard rules for contributors

- Never commit seed phrases, secret keys, or `.env.local` values
- Never invent transaction hashes or on-chain user counts for evidence
- Frontend must never ask users for a secret key
