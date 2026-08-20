# Screenshots

| File | What it shows |
|---|---|
| `mobile-landing.png` | Mobile landing (390×844) |
| `mobile-dashboard.png` | Mobile dashboard shell |
| `desktop-landing.png` | Desktop landing hero |
| `desktop-organizations.png` | Organizations + search/filters |
| `desktop-settings.png` | Settings / contract IDs / theme |
| `desktop-relationships.png` | Relationships lifecycle UI |
| `ci-green-run.png` | Green GitHub Actions CI run |
| `analytics.png` | Analytics against live Testnet RPC |
| `monitoring.png` | Settings monitoring (Sentry/PostHog local-only) |
| `feedback-summary.png` | In-app feedback owner summary (demo testers) |

Capture locally:

```bash
npx playwright screenshot --viewport-size=1280,800 https://trust-mesh-taupe.vercel.app/organizations docs/screenshots/desktop-organizations.png
```
