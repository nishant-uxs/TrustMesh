# Monitoring

Frontend exceptions and failed signed actions are recorded as **incidents**.

## Local incident log

Always on. Stored in `localStorage` (`tm-incidents`).

- Human-readable `AppError` message
- Error kind (`UserRejected`, `Network`, `Timeout`, …)
- Action context (`register_organization`, `wallet_connect`, …)
- No seed phrases, no private keys, no full wallet addresses in the payload we send to Sentry

Inspect recent incidents under **Settings → Monitoring**.

## Optional Sentry

Set in `frontend/.env.local`:

```
NEXT_PUBLIC_SENTRY_DSN=https://...@o....ingest.sentry.io/...
```

Without a DSN, Sentry is not initialized and the app stays local-only.

Create a Sentry browser project, copy the DSN into Vercel env vars, redeploy. Do not commit the DSN if you treat it as sensitive; a public DSN is still scoped to that project.

The Error Boundary reports UI crashes. `runSignedAction` reports failed transactions.
