# Green Belt evidence (real artifacts only)

Do not invent users, transactions, or metrics. Links below point at files generated from live Stellar Testnet CLI invokes and a local app run against Testnet RPC.

**Label:** Testnet demo identities / demo testers — **not** organic production users.

## Links

| Item | URL |
|---|---|
| Public GitHub | https://github.com/nishant-uxs/TrustMesh |
| Live demo | https://trust-mesh-taupe.vercel.app/ |
| Demo video | https://drive.google.com/file/d/1GWH_qCdsZ1c9zzUfPgUF_nY-hmoOfmzN/view?usp=sharing |
| First deploy tx | https://stellar.expert/explorer/testnet/tx/384cb67cad2cdcc4c27dc50bb445aed03da1c7619e0d3cec78ac78f80ba7fcd0 |
| Wallet interactions | [`docs/evidence/WALLET_INTERACTIONS.md`](./evidence/WALLET_INTERACTIONS.md) |
| End-to-end demo activity | [`docs/evidence/DEMO_ACTIVITY.md`](./evidence/DEMO_ACTIVITY.md) |
| Feedback summary | [`docs/evidence/FEEDBACK_SUMMARY.md`](./evidence/FEEDBACK_SUMMARY.md) |

## Screenshots (repo)

See [`docs/screenshots/`](./screenshots/).

- [x] Product analytics — [`analytics.png`](./screenshots/analytics.png) (live Testnet counts; product events empty until this browser records them)
- [x] Monitoring — [`monitoring.png`](./screenshots/monitoring.png) (Sentry/PostHog local-only)
- [x] Feedback owner summary — [`feedback-summary.png`](./screenshots/feedback-summary.png)
- [x] Onboarding / mobile / relationships (earlier captures in the same folder)

## 10+ real wallet interactions

Full table + explorer links: [`docs/evidence/WALLET_INTERACTIONS.md`](./evidence/WALLET_INTERACTIONS.md)  
Reproduce: `node scripts/demo-users.mjs --count 10`

## End-to-end product workflow

Verify → create relationship → accept → complete → submit review → verify review:  
[`docs/evidence/DEMO_ACTIVITY.md`](./evidence/DEMO_ACTIVITY.md)  
Reproduce: `node scripts/demo-activity.mjs`

## User feedback (demo testers)

[`docs/evidence/FEEDBACK_SUMMARY.md`](./evidence/FEEDBACK_SUMMARY.md) — 6 local notes, avg 3.8. Demo testers from a Testnet walkthrough, not organic remote users.
