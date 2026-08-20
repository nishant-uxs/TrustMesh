"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { NETWORK } from "@/lib/config";
import { isWalletLikelyOnTestnet } from "@/lib/wallets";

export function NetworkBanner() {
  const { address } = useWallet();
  const [wrongNetwork, setWrongNetwork] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!address) {
        if (!cancelled) setWrongNetwork(false);
        return;
      }
      const ok = await isWalletLikelyOnTestnet();
      if (!cancelled) setWrongNetwork(!ok);
    }
    void check();
    const id = window.setInterval(() => void check(), 15_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [address]);

  if (!wrongNetwork) return null;

  return (
    <div
      className="mb-4 rounded-2xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-deep"
      role="status"
      data-testid="wrong-network-banner"
    >
      <p className="font-medium text-coral">Wallet is not on Stellar Testnet</p>
      <p className="mt-1 text-slate">
        Switch Freighter (or your wallet) to <strong>Testnet</strong> — passphrase{" "}
        <code className="text-xs">{NETWORK.passphrase}</code> — then retry.
      </p>
    </div>
  );
}
