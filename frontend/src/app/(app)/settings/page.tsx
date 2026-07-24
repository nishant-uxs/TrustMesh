"use client";

import { TopBar } from "@/components/layout/TopBar";
import { Badge } from "@/components/ui/Badge";
import { CONTRACTS, NETWORK, contractsConfigured } from "@/lib/config";
import { explorerContractUrl, shortenAddress } from "@/lib/format";

export default function SettingsPage() {
  const configured = contractsConfigured();

  return (
    <div>
      <TopBar
        title="Settings"
        subtitle="Network configuration, contract addresses, and wallet preferences."
      />
      <div className="grid max-w-3xl gap-6">
        <section className="tm-surface rounded-2xl p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl text-deep">Network</h2>
            <Badge tone="info">{NETWORK.name}</Badge>
          </div>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
              <dt className="text-slate">RPC</dt>
              <dd className="font-mono text-xs text-deep">{NETWORK.rpcUrl}</dd>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
              <dt className="text-slate">Passphrase</dt>
              <dd className="font-mono text-xs text-deep">{NETWORK.passphrase}</dd>
            </div>
          </dl>
        </section>

        <section className="tm-surface rounded-2xl p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl text-deep">Contracts</h2>
            <Badge tone={configured ? "success" : "warn"}>
              {configured ? "Configured" : "Not configured"}
            </Badge>
          </div>
          <ul className="mt-4 space-y-3">
            {Object.entries(CONTRACTS).map(([key, value]) => (
              <li
                key={key}
                className="flex flex-col gap-1 border-b border-deep/5 pb-3 last:border-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-sm text-slate">{key}</span>
                {value ? (
                  <a
                    href={explorerContractUrl(value)}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-xs text-sea underline"
                  >
                    {shortenAddress(value, 6)}
                  </a>
                ) : (
                  <span className="font-mono text-xs text-slate">not set</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
