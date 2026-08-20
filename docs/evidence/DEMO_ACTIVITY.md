# Demo activity (Testnet end-to-end)

**Testnet demo walkthrough, not organic users.**

One real product path against the already-deployed TrustMesh contracts:

`verify_organization` → `create_relationship` → `accept` (both) → `complete` (both) → `submit_review` → `verify_review`.

This product does not expose separate milestone / escrow-release methods; **accept → complete** is the lifecycle. Hashes are copied from Stellar CLI `Signing transaction` output only.

- Relationship id: **1**
- Review id: **2**
- Party A: `demo-user-01` / `GCK4GKBCTIASL6PPGLID6MDXKQUJT7IAZZJZIGQDFTQ2ANNS4JISCYCQ` (org 3)
- Party B: `demo-user-02` / `GC3ORHTLFIKFUZ7M4VUBZ4MYGRHJJWCXVCJ7MEOYEGF5WVPCTNIY4TKK` (org 4)
- Admin: `deployer`

Reproduce:

```bash
node scripts/demo-activity.mjs
```

## Steps

| Step | Actor | Action | Tx |
|---|---|---|---|
| verify_org_3 | deployer | verify_organization(3) | [f7bca2e9e4e1f222b16f22e690f72ab62b2a38b15978162b4960aed9ffcf14e1](https://stellar.expert/explorer/testnet/tx/f7bca2e9e4e1f222b16f22e690f72ab62b2a38b15978162b4960aed9ffcf14e1) |
| verify_org_4 | deployer | verify_organization(4) | [739810437c4c136998887fff1088a69e0085501c8f0d3653570c1a99117b8d32](https://stellar.expert/explorer/testnet/tx/739810437c4c136998887fff1088a69e0085501c8f0d3653570c1a99117b8d32) |
| create_relationship | demo-user-01 | factory.create_relationship | [e1c9ce9777eb0ab135a3de0e1c4050eaf1d50008388bcd4a016abcc0e2c66db0](https://stellar.expert/explorer/testnet/tx/e1c9ce9777eb0ab135a3de0e1c4050eaf1d50008388bcd4a016abcc0e2c66db0) |
| demo-user-01_accept | demo-user-01 | accept(relationship 1) | [cb2832f1655fd53d85e8c2ebcd1226ada54fe5697b3522ef0547815c2df86a8c](https://stellar.expert/explorer/testnet/tx/cb2832f1655fd53d85e8c2ebcd1226ada54fe5697b3522ef0547815c2df86a8c) |
| demo-user-02_accept | demo-user-02 | accept(relationship 1) | [16817d236022b4a6d1510d15e4e9feb66aa00fc60ca6798b0f02b8c452f6a7d4](https://stellar.expert/explorer/testnet/tx/16817d236022b4a6d1510d15e4e9feb66aa00fc60ca6798b0f02b8c452f6a7d4) |
| demo-user-01_complete | demo-user-01 | complete(relationship 1, quality 88) | [2a6135789959862407278631b44891ab3b4a5c4c0a4f384900cdc3daa91ca775](https://stellar.expert/explorer/testnet/tx/2a6135789959862407278631b44891ab3b4a5c4c0a4f384900cdc3daa91ca775) |
| demo-user-02_complete | demo-user-02 | complete(relationship 1, quality 90) | [3cf7f44d82874c51929295df84486cd4e6c911cb9dcf1433cb5ee0a154f4ff8f](https://stellar.expert/explorer/testnet/tx/3cf7f44d82874c51929295df84486cd4e6c911cb9dcf1433cb5ee0a154f4ff8f) |
| submit_review | demo-user-01 | submit_review | [3197d4e43a09f42f5d904ab6e0298af6dfac99a3aa5e72ee4048554feb859b4c](https://stellar.expert/explorer/testnet/tx/3197d4e43a09f42f5d904ab6e0298af6dfac99a3aa5e72ee4048554feb859b4c) |
| verify_review | deployer | verify_review(2) | [e6b714b0a00b42427e2077e9e4dadbd806ae0ad78c0b2a0f6b12e6a7ae76d31c](https://stellar.expert/explorer/testnet/tx/e6b714b0a00b42427e2077e9e4dadbd806ae0ad78c0b2a0f6b12e6a7ae76d31c) |

Generated at 2026-08-20T16:39:34.965Z.
