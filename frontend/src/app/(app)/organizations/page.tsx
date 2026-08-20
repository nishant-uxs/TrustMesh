"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { toast } from "@/components/providers/ToastProvider";
import { Badge, EmptyState, Skeleton } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorBanner, TxStatus } from "@/components/ui/ErrorBanner";
import { Pagination, SearchFilters } from "@/components/ui/SearchFilters";
import { useTrustData } from "@/hooks/useTrustData";
import { useWallet } from "@/hooks/useWallet";
import { contractsConfigured } from "@/lib/config";
import { registerOrganization } from "@/lib/contracts";
import { classifyError } from "@/lib/errors";
import { runSignedAction } from "@/lib/tx";
import { track } from "@/lib/analyticsClient";
import type { OrgType, TxState } from "@/lib/types";

const ORG_TYPES: OrgType[] = [
  "Business",
  "Startup",
  "Agency",
  "Freelancer",
  "Vendor",
  "ServiceProvider",
];

const PAGE_SIZE = 6;

export default function OrganizationsPage() {
  const { orgs, loading, refresh } = useTrustData();
  const { address, connect } = useWallet();
  const [name, setName] = useState("");
  const [orgType, setOrgType] = useState<OrgType>("Business");
  const [uri, setUri] = useState("");
  const [tx, setTx] = useState<TxState>({ phase: "idle" });
  const [error, setError] = useState<ReturnType<typeof classifyError> | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orgs.filter((org) => {
      if (filter === "verified" && !org.verified) return false;
      if (filter === "pending" && org.verified) return false;
      if (!q) return true;
      return (
        org.name.toLowerCase().includes(q) ||
        String(org.id).includes(q) ||
        org.orgType.toLowerCase().includes(q)
      );
    });
  }, [orgs, query, filter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
    const result = await runSignedAction(
      "register_organization",
      (report) => registerOrganization(address, name, orgType, uri, report),
      (phase, extra) => setTx({ phase, hash: extra?.hash, error: extra?.error, message: extra?.error }),
    );
    if (!result.ok) {
      setError(result.error);
      toast.error(result.error.message);
      return;
    }
    track("organization_created");
    toast.success("Organization published. Others can now start a relationship with you.");
    setName("");
    setUri("");
    await refresh(true);
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
          {error && <ErrorBanner error={error} address={address} onDismiss={() => setError(null)} />}
        </form>

        <div className="space-y-4 lg:col-span-3">
          <SearchFilters
            placeholder="Search organizations…"
            filters={[
              { label: "All", value: "all" },
              { label: "Verified", value: "verified" },
              { label: "Pending", value: "pending" },
            ]}
            onSearch={(q) => {
              setQuery(q);
              setPage(1);
            }}
            onFilter={(v) => {
              setFilter(v);
              setPage(1);
            }}
          />
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))
          ) : pageItems.length === 0 ? (
            <div className="tm-surface rounded-2xl">
              <EmptyState
                title="No organizations registered"
                description="Submit the form to register your organization on Stellar Testnet."
              />
            </div>
          ) : (
            pageItems.map((org, i) => (
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
                      #{org.id} · {org.orgType} · {org.vendorCount} vendors
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
          <Pagination page={page} pageCount={pageCount} onChange={setPage} />
        </div>
      </div>
    </div>
  );
}
