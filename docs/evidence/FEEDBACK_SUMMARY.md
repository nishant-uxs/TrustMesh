# Feedback summary (demo testers)

**These are demo testers from a Testnet walkthrough of this TrustMesh app — not organic production users and not remote accounts.**

Notes were entered through the in-app Feedback page (`/feedback`) and stored in browser localStorage (`tm-feedback-notes`).

## Counts

| Metric | Value |
|---|---|
| Notes | 6 |
| Average rating | 3.8 |
| Rating mix | 5, 4, 4, 3, 4, 3 |

## Themes

1. **Admin vs user wallet friction** — verifying orgs / reviews needs the deployer; normal Freighter users hit unauthorized.
2. **Duplicate register / already-registered errors** — re-running register after a successful tx is confusing.
3. **Units & fees** — treasury deposit amounts / stroops are unclear in the UI copy.
4. **Nav depth** — Feedback / Analytics / Settings feel buried next to the core org/relationship path.
5. **Auth / Freighter errors** — failed signatures and “account not funded” recovery are easy to miss.

## Raw notes

### tester-01 · 4/5
- Liked: org register finally landed on testnet and showed up in Organizations after refresh
- Confusing: tried create relationship before verify, got OrgNotVerified with no plain English
- Improve: say “needs admin verify” next to unverified badges
- Request: show pending vs verified filter by default
- Comments: used Freighter. first attempt failed because i was still on the wrong network tab

### tester-02 · 3/5
- Liked: relationship accept/complete buttons are obvious once you have a row
- Confusing: submitted register twice, second one yelled AlreadyRegistered and i thought the first tx failed
- Improve: disable the register button after a successful hash
- Request: —
- Comments: quality score on complete — is that percent? out of 100? not labeled well

### tester-03 · 5/5
- Liked: analytics page actually showed org counts from chain, not empty fake charts
- Confusing: Reviews verify button only works if wallet == admin. spent 10 min wondering why auth failed
- Improve: hide verify for non-admin or show “admin only”
- Request: toast with explorer link stays longer
- Comments: mobile sidebar was fine. desktop ok.

### tester-04 · 4/5
- Liked: onboarding role picker is short
- Confusing: Settings monitoring says local-only which is honest but i kept looking for PostHog numbers that aren’t there
- Improve: one line on Analytics: “product events = this browser only”
- Request: export feedback csv
- Comments: deposit “stroops” wording made me think i was sending real XLM fees somehow

### tester-05 · 3/5
- Liked: empty states aren’t yelling at you
- Confusing: buried Feedback under the fold of the nav; almost missed it after Activity
- Improve: put Feedback closer to Reviews while testing
- Request: —
- Comments: freighter popup got stuck once, had to disconnect/reconnect. error banner helped on retry.

### tester-06 · 4/5
- Liked: end-to-end walkthrough (accept → complete → review) finally updated reputation
- Confusing: which org id is mine? had to open Organizations and match the G address manually
- Improve: highlight “your org” when wallet is connected
- Request: copyable tx hash on every success toast
- Comments: not bad for testnet. dont call it production ready yet lol

## Screenshot

In-app owner summary: [`docs/screenshots/feedback-summary.png`](../screenshots/feedback-summary.png)
