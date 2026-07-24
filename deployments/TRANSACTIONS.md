# TrustMesh Testnet Transactions

Network: **Stellar Testnet**  
Deployer: `GC5VBHY5DWV7NTL4PCQL3XGOE4FY2DJHM2JYLRC6YS2IHYTPDZ4DOFIU`

## Contract deploy transactions

| Contract | Address | Deploy Tx |
|---|---|---|
| Organization Registry | `CD6AAYZ7IVW6SQDP6NRKRZ3QIRQQPB3ZDRKTSA7ZBU2VRWN4VM4ZNRZT` | [`384cb67c…fcd0`](https://stellar.expert/explorer/testnet/tx/384cb67cad2cdcc4c27dc50bb445aed03da1c7619e0d3cec78ac78f80ba7fcd0) |
| Reputation | `CDYSM4LG4OUPSXGDDSJMZK7H532223GNBAF6I5RAYAFG74HD5QRPRBL5` | [`87c2f971…6a03`](https://stellar.expert/explorer/testnet/tx/87c2f9713cc42ac2ce2f7722b5db178b283eb0b5a3bc741d90d46dda2bb56a03) |
| Treasury | `CA63C3PLR2GQRNLES6JO72YPFO6HWUYLVWFPZBNY47BRZPYSPUGWMONH` | [`99df798b…78c8`](https://stellar.expert/explorer/testnet/tx/99df798b795bf5a2c25ae710c75a119e659816791662522914216ab225a478c8) |
| Trust Relationship | `CBCTIWGKIIGMDMJNPGT4OLVITGTVTW3JFTMHKYBOT42ENZZWEITJLDXJ` | [`9e64a5fa…13ac`](https://stellar.expert/explorer/testnet/tx/9e64a5faaeaaa9de88262d4b0693a623d7ad3e676ff1cd5159de2e67c17413ac) |
| Trust Relationship Factory | `CBF5KOXX34HEF3Q6ECLWQY543V53HJRJ25W5X3DO6O2XII4GP2FHJGHK` | [`59e60a24…daf1`](https://stellar.expert/explorer/testnet/tx/59e60a247694cdbd873c81eb7396bbd78fbc2e7df0519f822bc21a609a8cdaf1) |
| Review Verification | `CBXOCI2BQTCDUJOVJCAC7TQLBA5HNGVU7UQ5JDLJF44ZHOZBG4PLJ3KF` | [`001c4119…54d2`](https://stellar.expert/explorer/testnet/tx/001c4119d9c646b48ace04633e28d049f7f6bb17ac5771b29167470da89154d2) |

## Initialization transactions

| Action | Tx Hash |
|---|---|
| `organization_registry.initialize` | [`02f072d602609f2fed30cd55f7e803ef1129633e4950772674268c50d84582a8`](https://stellar.expert/explorer/testnet/tx/02f072d602609f2fed30cd55f7e803ef1129633e4950772674268c50d84582a8) |
| `reputation.initialize` | [`5841416e373b7937fbdac9a999e4d9312b13fdc4290ac4e49c3a0c33e3aac94b`](https://stellar.expert/explorer/testnet/tx/5841416e373b7937fbdac9a999e4d9312b13fdc4290ac4e49c3a0c33e3aac94b) |
| `treasury.initialize` | [`44edd3744b2ab1bb7642d3d7c97eee4ae674a6d4d6596230ca346bb37bcdfc65`](https://stellar.expert/explorer/testnet/tx/44edd3744b2ab1bb7642d3d7c97eee4ae674a6d4d6596230ca346bb37bcdfc65) |
| `trust_relationship.initialize` | [`767a9bbc26e10f2f3b1700fca276720c508fff16fb895691c5bf431a628e523d`](https://stellar.expert/explorer/testnet/tx/767a9bbc26e10f2f3b1700fca276720c508fff16fb895691c5bf431a628e523d) |
| `trust_relationship_factory.initialize` | [`da44f3e37f1fefa861ed4e39fe6c08cd2d19afbd484d18781e6212bd5bd88d27`](https://stellar.expert/explorer/testnet/tx/da44f3e37f1fefa861ed4e39fe6c08cd2d19afbd484d18781e6212bd5bd88d27) |
| `review_verification.initialize` | [`c8939f1c91136fc435d0f9b7b7e4a3e3e723c75fe387177f3f95312f0ecb8a56`](https://stellar.expert/explorer/testnet/tx/c8939f1c91136fc435d0f9b7b7e4a3e3e723c75fe387177f3f95312f0ecb8a56) |

## Authorization wiring (cross-contract)

| Action | Tx Hash |
|---|---|
| Authorize factory on reputation | [`8fd53e42228ef5ad67f4c819daa2a03b35d13b71b22f355a872d58520b9b00f2`](https://stellar.expert/explorer/testnet/tx/8fd53e42228ef5ad67f4c819daa2a03b35d13b71b22f355a872d58520b9b00f2) |
| Authorize trust_relationship on reputation | [`093e462adc3eba7b0b9fea9dd19f14dacbddc1f3a79101c6d06edf0b80a520aa`](https://stellar.expert/explorer/testnet/tx/093e462adc3eba7b0b9fea9dd19f14dacbddc1f3a79101c6d06edf0b80a520aa) |
| Authorize review_verification on reputation | [`35a957998773243d57b51cac9294106280ed4bb01615cb6f81c5e6fdf785cfff`](https://stellar.expert/explorer/testnet/tx/35a957998773243d57b51cac9294106280ed4bb01615cb6f81c5e6fdf785cfff) |
| Authorize factory on treasury | [`2dce31d570c6e1bb03e613140f7c187ce8bd8e5fcc4b20d40511658160561c18`](https://stellar.expert/explorer/testnet/tx/2dce31d570c6e1bb03e613140f7c187ce8bd8e5fcc4b20d40511658160561c18) |
| Authorize review_verification on treasury | [`b54497e6acf9deaa8acc0e808ad3b25b02b7eb028dd66a99d731061dc3bf070d`](https://stellar.expert/explorer/testnet/tx/b54497e6acf9deaa8acc0e808ad3b25b02b7eb028dd66a99d731061dc3bf070d) |

## Sample application flow

| Action | Event | Tx Hash |
|---|---|---|
| `register_organization("TrustMesh Demo Co")` | `OrganizationRegistered` | [`fa96bc2eefc492914cfd0641a667fb0df03b0be12ba3c3a97e67dcd5cd960a24`](https://stellar.expert/explorer/testnet/tx/fa96bc2eefc492914cfd0641a667fb0df03b0be12ba3c3a97e67dcd5cd960a24) |
| `verify_organization(1)` | `OrganizationVerified` | [`be97ac73cf039396e1957ea0fdfa88ed328586cccc1c6ec02c985ffefc608d76`](https://stellar.expert/explorer/testnet/tx/be97ac73cf039396e1957ea0fdfa88ed328586cccc1c6ec02c985ffefc608d76) |
| `reputation.ensure_tracked(1)` | — | [`56a5bf62bc744b19391d1b9875e25636aa01d2567be30e760f9ed9519377f9c5`](https://stellar.expert/explorer/testnet/tx/56a5bf62bc744b19391d1b9875e25636aa01d2567be30e760f9ed9519377f9c5) |

Environment file: [`testnet.env`](./testnet.env)
