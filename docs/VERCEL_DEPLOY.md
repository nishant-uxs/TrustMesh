# TrustMesh — Vercel deploy guide

Frontend folder: `frontend/`  
Repo: https://github.com/nishant-uxs/TrustMesh

---

## Method A — Dashboard (easiest, recommended)

### 1. Login
1. Open https://vercel.com/login  
2. **Continue with GitHub**  
3. Same account as `nishant-uxs` (ya jahan TrustMesh repo hai)

### 2. Import project
1. https://vercel.com/new  
2. **Import** → `nishant-uxs/TrustMesh`  
3. Agar repo list mein nahi dikhe → **Adjust GitHub App Permissions** → TrustMesh allow karo

### 3. Project settings (IMPORTANT)

| Field | Value |
|---|---|
| **Framework Preset** | Next.js |
| **Root Directory** | `frontend` ← Edit pe click karke set karo |
| **Build Command** | `npm run build` (default) |
| **Output Directory** | leave default (Next.js handles it) |
| **Install Command** | `npm install` |

### 4. Environment Variables

**Settings → Environment Variables** mein ye add karo (Production + Preview + Development):

```
NEXT_PUBLIC_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_ORGANIZATION_REGISTRY_ID=CD6AAYZ7IVW6SQDP6NRKRZ3QIRQQPB3ZDRKTSA7ZBU2VRWN4VM4ZNRZT
NEXT_PUBLIC_REPUTATION_ID=CDYSM4LG4OUPSXGDDSJMZK7H532223GNBAF6I5RAYAFG74HD5QRPRBL5
NEXT_PUBLIC_TREASURY_ID=CA63C3PLR2GQRNLES6JO72YPFO6HWUYLVWFPZBNY47BRZPYSPUGWMONH
NEXT_PUBLIC_TRUST_RELATIONSHIP_ID=CBCTIWGKIIGMDMJNPGT4OLVITGTVTW3JFTMHKYBOT42ENZZWEITJLDXJ
NEXT_PUBLIC_TRUST_RELATIONSHIP_FACTORY_ID=CBF5KOXX34HEF3Q6ECLWQY543V53HJRJ25W5X3DO6O2XII4GP2FHJGHK
NEXT_PUBLIC_REVIEW_VERIFICATION_ID=CBXOCI2BQTCDUJOVJCAC7TQLBA5HNGVU7UQ5JDLJF44ZHOZBG4PLJ3KF
```

Same values: [`deployments/testnet.env`](../deployments/testnet.env)

### 5. Deploy
1. **Deploy** click  
2. 1–3 min wait  
3. URL milegi jaise: `https://trustmesh-xxxx.vercel.app`

### 6. README update
Live URL copy karke root `README.md` ke **Live demo & submission** table mein paste karo.

---

## Method B — CLI

```bash
# once
npm i -g vercel

# login (opens browser)
vercel login

# from repo root
cd frontend
vercel
```

Prompts:
- Link to existing project? **N** (first time) / **Y** (later)
- Scope: apna `nishant-uxs` team/account
- Project name: `trustmesh` (ya jo chaho)
- Directory: `.` (already inside frontend)

Production deploy:

```bash
cd frontend
vercel --prod
```

Env vars CLI se (optional):

```bash
cd frontend
vercel env add NEXT_PUBLIC_ORGANIZATION_REGISTRY_ID
# paste value, select Production/Preview/Development
# baaki NEXT_PUBLIC_* same tarah
```

Ya dashboard se ek baar env set karke chhod do — baad ke deploys reuse karenge.

---

## Common mistakes

| Mistake | Fix |
|---|---|
| Root Directory blank / `.` | Must be **`frontend`** |
| Env vars missing | App “Not configured” dikhega — vars add + **Redeploy** |
| Wrong GitHub account | Vercel ko `nishant-uxs` GitHub se connect karo |
| Build fails on wallet peers | Repo mein `frontend/.npmrc` already `legacy-peer-deps=true` hai |

---

## After deploy checklist

- [ ] Open live URL → Landing loads  
- [ ] **Settings** → 6 contract IDs dikhte hain  
- [ ] Freighter Testnet → Connect Wallet works  
- [ ] Organizations → register → wallet sign (real Testnet tx)  
- [ ] Paste live URL into README  

---

## Files in this repo

| File | Purpose |
|---|---|
| `frontend/vercel.json` | Next.js framework + build/install hints |
| `frontend/.npmrc` | Peer-dep install for wallet kit |
| `deployments/testnet.env` | Copy-paste source for Vercel env vars |
| `docs/VERCEL_DEPLOY.md` | This guide |
