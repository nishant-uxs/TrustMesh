"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CONTRACTS, NETWORK, contractsConfigured } from "@/lib/config";
import { explorerContractUrl, shortenAddress, timeAgo } from "@/lib/format";
import { loadIncidents, posthogConfigured, sentryConfigured, type Incident } from "@/lib/monitoring";

export default function SettingsPage() {
  const configured = contractsConfigured();
  const { theme, toggle } = useTheme();
  const [incidents, setIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    setIncidents(loadIncidents().slice(-8).reverse());
  }, []);

  return (
    <div>
      <TopBar
        title="Settings"
        subtitle="Network, contracts, appearance, and operational health."
      />
      <div className="grid max-w-3xl gap-6">
        <section className="tm-surface rounded-2xl p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl text-deep">Appearance</h2>
              <p className="mt-1 text-sm text-slate">Toggle light / dark console theme.</p>
            </div>
            <Button variant="secondary" size="sm" onClick={toggle}>
              {theme === "light" ? "Switch to dark" : "Switch to light"}
            </Button>
          </div>
        </section>

        <section className="tm-surface rounded-2xl p-6">
          <h2 className="font-display text-xl text-deep">Monitoring</h2>
          <p className="mt-1 text-sm text-slate">
            Failures are stored locally in this browser. Optional Sentry is used only when a DSN is configured.
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-slate">Sentry</dt>
              <dd>
                <Badge tone={sentryConfigured() ? "success" : "neutral"}>
                  {sentryConfigured() ? "DSN configured" : "Local-only"}
                </Badge>
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate">PostHog</dt>
              <dd>
                <Badge tone={posthogConfigured() ? "success" : "neutral"}>
                  {posthogConfigured() ? "Key configured" : "Local-only"}
                </Badge>
              </dd>
            </div>
          </dl>
          {incidents.length === 0 ? (
            <p className="mt-4 text-sm text-slate">No captured incidents in this browser.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {incidents.map((item) => (
                <li key={item.id} className="rounded-xl bg-deep/5 px-3 py-2 text-sm">
                  <p className="text-deep">{item.message}</p>
                  <p className="mt-1 text-xs text-slate">
                    {item.kind}
                    {item.context ? ` · ${item.context}` : ""} · {timeAgo(Math.floor(item.at / 1000))}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

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
