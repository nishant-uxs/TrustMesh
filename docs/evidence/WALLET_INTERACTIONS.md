# Wallet interactions (Testnet)

**Testnet demo identities, not organic users.**

These accounts were generated with the official Stellar CLI keystore
(`stellar keys generate NAME --network testnet --fund`) and funded via
Friendbot. Each identity signed at least one real invoke against the
already-deployed TrustMesh contracts. Hashes are copied from CLI
`Signing transaction: <64 hex>` output. Nothing here is organic
product traffic.

Contracts (`deployments/testnet.json`):

- Organization registry: `CD6AAYZ7IVW6SQDP6NRKRZ3QIRQQPB3ZDRKTSA7ZBU2VRWN4VM4ZNRZT`
- Treasury: `CA63C3PLR2GQRNLES6JO72YPFO6HWUYLVWFPZBNY47BRZPYSPUGWMONH`
- Review verification: `CBXOCI2BQTCDUJOVJCAC7TQLBA5HNGVU7UQ5JDLJF44ZHOZBG4PLJ3KF`

Reproduce:

```bash
node scripts/demo-users.mjs --count 10
```

Secret keys and seed phrases are **not** stored in this repo. They remain
in the local CLI keystore only.

## Unique demo identities (one G-address each)

| Identity | Role | Address | Action | Tx |
|---|---|---|---|---|
| demo-user-01 | buyer | `GCK4GKBCTIASL6PPGLID6MDXKQUJT7IAZZJZIGQDFTQ2ANNS4JISCYCQ` | register_organization (Business: Northwind Supply Co 01) | [41ab136a56dc1025a82545d27cb3bf617888cedbbf6d16e91d4e07a39e51d74e](https://stellar.expert/explorer/testnet/tx/41ab136a56dc1025a82545d27cb3bf617888cedbbf6d16e91d4e07a39e51d74e) |
| demo-user-02 | manufacturer | `GC3ORHTLFIKFUZ7M4VUBZ4MYGRHJJWCXVCJ7MEOYEGF5WVPCTNIY4TKK` | register_organization (Startup: Helix Labs 02) | [0d62c2523d2017549200fc3e3aff840b5c9b5877ee34bbdd4269e87c1adc765f](https://stellar.expert/explorer/testnet/tx/0d62c2523d2017549200fc3e3aff840b5c9b5877ee34bbdd4269e87c1adc765f) |
| demo-user-03 | agency | `GDAFHBUSHH7IEYHKLML4MXRRBCBQFGFP77VRBAC2AVSXHEERSRGGPSRV` | register_organization (Agency: Harbor Creative 03) | [f6a37cfb560240e3e35a170c48e765b80fded3a99e82923d3799df8ff3116ca6](https://stellar.expert/explorer/testnet/tx/f6a37cfb560240e3e35a170c48e765b80fded3a99e82923d3799df8ff3116ca6) |
| demo-user-04 | freelancer | `GBPRD2J6U3RWN5E7BANH4HFILD5ACNJCSBXUMC37HYJJMMDQ2KVASWN7` | register_organization (Freelancer: Ada Patel Studio 04) | [d8bf17172e0da7044ede9bd43155e47abd837176c547645bebc9db427c81b9aa](https://stellar.expert/explorer/testnet/tx/d8bf17172e0da7044ede9bd43155e47abd837176c547645bebc9db427c81b9aa) |
| demo-user-05 | supplier | `GCLE75Q7JDKNRLJ7CBD253CDIBLS7SKBHYL63VLF6M3GJS2L65AASDWC` | register_organization (Vendor: Summit Parts 05) | [1af6a5c6dcc7e8efb2ed56b8455e0b961704c6ba159df3347b807a6b43c37e2f](https://stellar.expert/explorer/testnet/tx/1af6a5c6dcc7e8efb2ed56b8455e0b961704c6ba159df3347b807a6b43c37e2f) |
| demo-user-06 | service_provider | `GAFYJ3K6WNJWMOG3ODNDGB2KKVCG2PCGBNV7A4LKFUIN55IVKVG3LJU5` | register_organization (ServiceProvider: Nimbus Support 06) | [57faba051ff811b4a1558e9fd79bca54c4f457bbf3402e9faf7b0cf1ef82e0ee](https://stellar.expert/explorer/testnet/tx/57faba051ff811b4a1558e9fd79bca54c4f457bbf3402e9faf7b0cf1ef82e0ee) |
| demo-user-07 | treasury_depositor | `GC3CERAMKL3PECKRRHGDCA66LEJTHDB62PWFEUIQZ7BOFHIBLIXDMHKU` | treasury.deposit (350 stroops, ledger accounting) | [8474b66dc9b1cf08e1b6181bb1ff8e135c8dbec8c714c1f3f1bf8c8c1e3a54c7](https://stellar.expert/explorer/testnet/tx/8474b66dc9b1cf08e1b6181bb1ff8e135c8dbec8c714c1f3f1bf8c8c1e3a54c7) |
| demo-user-08 | treasury_depositor | `GA5BYSJFDREEE455CJNOXGOID2ISOXKBS453BZQLGTBGYX3QCAAQ2RGV` | treasury.deposit (375 stroops, ledger accounting) | [1d93996516da2db85cb8a8c7674b014bcd301cda266aed31d46154f11a1bee79](https://stellar.expert/explorer/testnet/tx/1d93996516da2db85cb8a8c7674b014bcd301cda266aed31d46154f11a1bee79) |
| demo-user-09 | org_operator | `GC2DPIOCE26ZPASNK3LAT2ENQ25FH4ATZ76FNB22OPVSJKO5WSXMMSME` | register_organization (Agency: Willow Analytics 09) | [3c8496cf03b262f07df94a9bdab38e8b6f531d4379b1b68255a20ec8b549b345](https://stellar.expert/explorer/testnet/tx/3c8496cf03b262f07df94a9bdab38e8b6f531d4379b1b68255a20ec8b549b345) |
| demo-user-10 | reviewer | `GCCDWUMOW5IS7OYNXNZE2VNUJ6SBBZCDT3425M55BUE2U43GBU6MTTDW` | register_organization (Freelancer: Brightline Review Desk 10) | [789c157063eede3a6221a099b6a4a6d41d649195b24582ae7546df60d73a76df](https://stellar.expert/explorer/testnet/tx/789c157063eede3a6221a099b6a4a6d41d649195b24582ae7546df60d73a76df) |
| demo-user-20260820-22 | loop_demo | `GCPWJG3R2VUBLWOZUVMFVSQIEUBL43Q6JW27U45Y2YJSZPIYD7NJT3XF` | treasury.deposit (275 stroops) | [1c95a81febb50f7371b89259b44d902dbed5a9fb6795719ff8612f14e926627c](https://stellar.expert/explorer/testnet/tx/1c95a81febb50f7371b89259b44d902dbed5a9fb6795719ff8612f14e926627c) |

## All signed transactions

| Identity | Role | Address | Action | Tx |
|---|---|---|---|---|
| demo-user-01 | buyer | `GCK4GKBCTIASL6PPGLID6MDXKQUJT7IAZZJZIGQDFTQ2ANNS4JISCYCQ` | register_organization (Business: Northwind Supply Co 01) | [41ab136a56dc1025a82545d27cb3bf617888cedbbf6d16e91d4e07a39e51d74e](https://stellar.expert/explorer/testnet/tx/41ab136a56dc1025a82545d27cb3bf617888cedbbf6d16e91d4e07a39e51d74e) |
| demo-user-02 | manufacturer | `GC3ORHTLFIKFUZ7M4VUBZ4MYGRHJJWCXVCJ7MEOYEGF5WVPCTNIY4TKK` | register_organization (Startup: Helix Labs 02) | [0d62c2523d2017549200fc3e3aff840b5c9b5877ee34bbdd4269e87c1adc765f](https://stellar.expert/explorer/testnet/tx/0d62c2523d2017549200fc3e3aff840b5c9b5877ee34bbdd4269e87c1adc765f) |
| demo-user-03 | agency | `GDAFHBUSHH7IEYHKLML4MXRRBCBQFGFP77VRBAC2AVSXHEERSRGGPSRV` | register_organization (Agency: Harbor Creative 03) | [f6a37cfb560240e3e35a170c48e765b80fded3a99e82923d3799df8ff3116ca6](https://stellar.expert/explorer/testnet/tx/f6a37cfb560240e3e35a170c48e765b80fded3a99e82923d3799df8ff3116ca6) |
| demo-user-04 | freelancer | `GBPRD2J6U3RWN5E7BANH4HFILD5ACNJCSBXUMC37HYJJMMDQ2KVASWN7` | register_organization (Freelancer: Ada Patel Studio 04) | [d8bf17172e0da7044ede9bd43155e47abd837176c547645bebc9db427c81b9aa](https://stellar.expert/explorer/testnet/tx/d8bf17172e0da7044ede9bd43155e47abd837176c547645bebc9db427c81b9aa) |
| demo-user-05 | supplier | `GCLE75Q7JDKNRLJ7CBD253CDIBLS7SKBHYL63VLF6M3GJS2L65AASDWC` | register_organization (Vendor: Summit Parts 05) | [1af6a5c6dcc7e8efb2ed56b8455e0b961704c6ba159df3347b807a6b43c37e2f](https://stellar.expert/explorer/testnet/tx/1af6a5c6dcc7e8efb2ed56b8455e0b961704c6ba159df3347b807a6b43c37e2f) |
| demo-user-06 | service_provider | `GAFYJ3K6WNJWMOG3ODNDGB2KKVCG2PCGBNV7A4LKFUIN55IVKVG3LJU5` | register_organization (ServiceProvider: Nimbus Support 06) | [57faba051ff811b4a1558e9fd79bca54c4f457bbf3402e9faf7b0cf1ef82e0ee](https://stellar.expert/explorer/testnet/tx/57faba051ff811b4a1558e9fd79bca54c4f457bbf3402e9faf7b0cf1ef82e0ee) |
| demo-user-07 | treasury_depositor | `GC3CERAMKL3PECKRRHGDCA66LEJTHDB62PWFEUIQZ7BOFHIBLIXDMHKU` | treasury.deposit (350 stroops, ledger accounting) | [8474b66dc9b1cf08e1b6181bb1ff8e135c8dbec8c714c1f3f1bf8c8c1e3a54c7](https://stellar.expert/explorer/testnet/tx/8474b66dc9b1cf08e1b6181bb1ff8e135c8dbec8c714c1f3f1bf8c8c1e3a54c7) |
| demo-user-08 | treasury_depositor | `GA5BYSJFDREEE455CJNOXGOID2ISOXKBS453BZQLGTBGYX3QCAAQ2RGV` | treasury.deposit (375 stroops, ledger accounting) | [1d93996516da2db85cb8a8c7674b014bcd301cda266aed31d46154f11a1bee79](https://stellar.expert/explorer/testnet/tx/1d93996516da2db85cb8a8c7674b014bcd301cda266aed31d46154f11a1bee79) |
| demo-user-09 | org_operator | `GC2DPIOCE26ZPASNK3LAT2ENQ25FH4ATZ76FNB22OPVSJKO5WSXMMSME` | register_organization (Agency: Willow Analytics 09) | [3c8496cf03b262f07df94a9bdab38e8b6f531d4379b1b68255a20ec8b549b345](https://stellar.expert/explorer/testnet/tx/3c8496cf03b262f07df94a9bdab38e8b6f531d4379b1b68255a20ec8b549b345) |
| demo-user-09 | org_operator | `GC2DPIOCE26ZPASNK3LAT2ENQ25FH4ATZ76FNB22OPVSJKO5WSXMMSME` | register_vendor (org 9 → GCK4GK…) | [c25e61947f958b145bd7ca01da0e7df81f3e17a8bfb84067f5529c1ca9083337](https://stellar.expert/explorer/testnet/tx/c25e61947f958b145bd7ca01da0e7df81f3e17a8bfb84067f5529c1ca9083337) |
| demo-user-10 | reviewer | `GCCDWUMOW5IS7OYNXNZE2VNUJ6SBBZCDT3425M55BUE2U43GBU6MTTDW` | register_organization (Freelancer: Brightline Review Desk 10) | [789c157063eede3a6221a099b6a4a6d41d649195b24582ae7546df60d73a76df](https://stellar.expert/explorer/testnet/tx/789c157063eede3a6221a099b6a4a6d41d649195b24582ae7546df60d73a76df) |
| demo-user-10 | reviewer | `GCCDWUMOW5IS7OYNXNZE2VNUJ6SBBZCDT3425M55BUE2U43GBU6MTTDW` | submit_review (org 10 → org 3, rating 5) | [e12c5a055a9a5f3cd5adb48eb794c0f1187148f032d52588997d50a49faf4085](https://stellar.expert/explorer/testnet/tx/e12c5a055a9a5f3cd5adb48eb794c0f1187148f032d52588997d50a49faf4085) |
| demo-user-20260820-22 | loop_demo | `GCPWJG3R2VUBLWOZUVMFVSQIEUBL43Q6JW27U45Y2YJSZPIYD7NJT3XF` | treasury.deposit (275 stroops) | [1c95a81febb50f7371b89259b44d902dbed5a9fb6795719ff8612f14e926627c](https://stellar.expert/explorer/testnet/tx/1c95a81febb50f7371b89259b44d902dbed5a9fb6795719ff8612f14e926627c) |

Generated at 2026-08-19T08:51:09.865Z. Loop append 2026-08-20T16:55:00Z.
