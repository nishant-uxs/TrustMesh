# Analytics

TrustMesh tracks **product usage**, not personal data.

## What is collected

Local browser events (always on):

- `wallet_connected` / `wallet_disconnected`
- `onboarding_started` / `onboarding_completed`
- `organization_created`, relationship lifecycle, reviews
- `transaction_started` / `transaction_succeeded` / `transaction_failed`

Full wallet addresses are **never** stored. If an address is passed as a property it is shortened (`GABC…XYZ1`).

View the counts on **Analytics → Product usage**. Empty until real actions happen in that browser.

## Optional PostHog

Set in `frontend/.env.local` (never commit the key):

```
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

Without a key, PostHog is not initialized. Autocapture and session recording stay off.

See also: [`MONITORING.md`](./MONITORING.md)
