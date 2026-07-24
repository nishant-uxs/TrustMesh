# TrustMesh Frontend

Next.js 15 console for the TrustMesh Soroban trust network.

```bash
cp .env.example .env.local   # fill with deployments/testnet.env
npm install
npm run dev
```

Open http://localhost:3000

```bash
npm test
npm run build
```

Contract IDs and RPC URL come from `NEXT_PUBLIC_*` env vars. The UI starts empty and only shows on-chain data.
