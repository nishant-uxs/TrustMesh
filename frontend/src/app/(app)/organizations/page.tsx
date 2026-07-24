"use client";

import Link from "next/link";
import { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Badge, EmptyState } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorBanner, TxStatus } from "@/components/ui/ErrorBanner";
import { useTrustData } from "@/hooks/useTrustData";
import { useWallet } from "@/hooks/useWallet";
import { contractsConfigured } from "@/lib/config";
import { registerOrganization } from "@/lib/contracts";
import { classifyError } from "@/lib/errors";
import type { OrgType, TxState } from "@/lib/types";

const ORG_TYPES: OrgType[] = [
  "Business",
  "Startup",
  "Agency",
  "Freelancer",
  "Vendor",
  "ServiceProvider",
];

export default function OrganizationsPage() {
  const { orgs } = useTrustData();
  const { address, connect } = useWallet();
  const [name, setName] = useState("");
  const [orgType, setOrgType] = useState<OrgType>("Business");
  const [uri, setUri] = useState("");
  const [tx, setTx] = useState<TxState>({ phase: "idle" });
  const [error, setError] = useState<ReturnType<typeof classifyError> | null>(null);

  async function onRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!address) {
      await connect();
      return;
    }
    if (!contractsConfigured()) {
      setError(
        classifyError(
          new Error("not configured: missing contract addresses"),
        ),
      );
      return;
    }
    try {
      setTx({ phase: "simulating", message: "Building register_organization…" });
      setTx({ phase: "signing" });
      const hash = await registerOrganization(address, name, orgType, uri);
      setTx({ phase: "success", hash });
      setName("");
    } catch (err) {
      const appErr = classifyError(err);
      setError(appErr);
      setTx({ phase: "failed", error: appErr.message });
    }
  }

  return (
    <div>
      <TopBar
        title="Organizations"
        subtitle="Onboard businesses, vendors, agencies, and freelancers onto the trust registry."
      />

      <div className="grid gap-8 lg:grid-cols-5">
        <form
          onSubmit={onRegister}
          className="tm-surface space-y-4 rounded-2xl p-5 lg:col-span-2"
        >
          <h2 className="font-display text-xl text-deep">Register organization</h2>
          <label className="block text-sm">
            <span className="text-slate">Name</span>
            <input
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-deep/15 bg-white px-3 py-2.5 outline-none focus:border-sea"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate">Type</span>
            <select
              value={orgType}
              onChange={(e) => setOrgType(e.target.value as OrgType)}
              className="mt-1 w-full rounded-xl border border-deep/15 bg-white px-3 py-2.5 outline-none focus:border-sea"
            >
              {ORG_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-slate">Metadata URI</span>
            <input
              required
              value={uri}
              onChange={(e) => setUri(e.target.value)}
              className="mt-1 w-full rounded-xl border border-deep/15 bg-white px-3 py-2.5 outline-none focus:border-sea"
            />
          </label>
          <Button
            type="submit"
            className="w-full"
            loading={tx.phase === "simulating" || tx.phase === "signing" || tx.phase === "submitted"}
          >
            {address ? "Submit on-chain" : "Connect & register"}
          </Button>
          <TxStatus phase={tx.phase} hash={tx.hash} message={tx.message} />
          {error && <ErrorBanner error={error} onDismiss={() => setError(null)} />}
        </form>

        <div className="space-y-3 lg:col-span-3">
          {orgs.length === 0 ? (
            <div className="tm-surface rounded-2xl">
              <EmptyState
                title="No organizations registered"
                description="Submit the form to register your organization on Stellar Testnet."
              />
            </div>
          ) : (
            orgs.map((org, i) => (
              <Link
                key={org.id}
                href={`/profile/${org.id}`}
                className="tm-surface block rounded-2xl p-5 transition hover:border-sea/30 animate-fade-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-xl text-deep">{org.name}</h3>
                    <p className="mt-1 text-sm text-slate">
                      {org.orgType} · {org.vendorCount} vendors
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {org.verified ? (
                      <Badge tone="success">Verified</Badge>
                    ) : (
                      <Badge tone="warn">Pending</Badge>
                    )}
                    <span className="rounded-lg bg-foam px-2 py-1 font-mono text-sm text-deep">
                      {org.trustScore ?? 0}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
