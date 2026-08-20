"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { toast } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { TxPanel } from "@/components/ui/TxPanel";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useTrustData } from "@/hooks/useTrustData";
import { useWallet } from "@/hooks/useWallet";
import { track } from "@/lib/analyticsClient";
import { contractsConfigured } from "@/lib/config";
import { fetchOrganizationByOwner, registerOrganization } from "@/lib/contracts";
import { classifyError } from "@/lib/errors";
import { fundTestnetAccount } from "@/lib/horizon";
import { runSignedAction } from "@/lib/tx";
import type { OrgType, TxState } from "@/lib/types";

const ROLES: { type: OrgType; title: string; blurb: string }[] = [
  { type: "Business", title: "Business", blurb: "Company that hires or partners with others" },
  { type: "Startup", title: "Startup", blurb: "Early-stage team building a product" },
  { type: "Agency", title: "Agency", blurb: "Studio or consultancy delivering work" },
  { type: "Freelancer", title: "Freelancer", blurb: "Independent professional" },
  { type: "Vendor", title: "Vendor", blurb: "Supplier of goods or services" },
  { type: "ServiceProvider", title: "Service provider", blurb: "Ongoing support or operations" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { address, connect, connecting } = useWallet();
  const { update } = useOnboarding(address);
  const { refresh } = useTrustData();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<OrgType>("Business");
  const [name, setName] = useState("");
  const [funding, setFunding] = useState(false);
  const [tx, setTx] = useState<TxState>({ phase: "idle" });
  const [error, setError] = useState<ReturnType<typeof classifyError> | null>(null);

  const steps = useMemo(
    () => ["Welcome", "Wallet", "Role", "Organization", "Next steps"],
    [],
  );

  async function onFund() {
    if (!address) return;
    setFunding(true);
    setError(null);
    try {
      await fundTestnetAccount(address);
      track("account_funded");
      toast.success("Test funds added. You can continue.");
    } catch (err) {
      setError(classifyError(err));
    } finally {
      setFunding(false);
    }
  }

  async function onRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!address) {
      await connect();
      return;
    }
    if (!contractsConfigured()) {
      setError(classifyError(new Error("not configured: missing contract")));
      return;
    }
    const existing = await fetchOrganizationByOwner(address);
    if (existing) {
      update({ completed: true, role, orgId: existing.id });
      track("onboarding_completed", { existing: true });
      setStep(4);
      return;
    }
    const result = await runSignedAction(
      "register_organization",
      (report) =>
        registerOrganization(
          address,
          name.trim(),
          role,
          `trustmesh://org/${encodeURIComponent(name.trim())}`,
          report,
        ),
      (phase, extra) => setTx({ phase, hash: extra?.hash, error: extra?.error }),
    );
    if (!result.ok) {
      setError(result.error);
      return;
    }
    await refresh(true);
    const created = await fetchOrganizationByOwner(address);
    update({ completed: true, role, orgId: created?.id });
    track("organization_created");
    track("onboarding_completed");
    toast.success("Your organization is live on Testnet.");
    setStep(4);
  }

  return (
    <div>
      <TopBar
        title="Get started"
        subtitle="Four short steps. No blockchain jargon required."
      />

      <ol className="mb-8 flex flex-wrap gap-2" aria-label="Setup progress">
        {steps.map((label, i) => (
          <li
            key={label}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              i === step ? "bg-deep text-white" : i < step ? "bg-sea/20 text-sea" : "bg-deep/5 text-slate"
            }`}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <section className="tm-surface max-w-xl space-y-4 rounded-2xl p-6">
          <h2 className="font-display text-2xl text-deep">Build a public trust record</h2>
          <p className="text-sm leading-relaxed text-slate">
            TrustMesh helps businesses prove they actually completed work together.
            You will create an organization profile, then you can start relationships
            and reviews that anyone can verify.
          </p>
          <Button
            onClick={() => {
              track("onboarding_started");
              setStep(1);
            }}
          >
            Start setup
          </Button>
        </section>
      )}

      {step === 1 && (
        <section className="tm-surface max-w-xl space-y-4 rounded-2xl p-6">
          <h2 className="font-display text-2xl text-deep">Connect a Stellar wallet</h2>
          <p className="text-sm leading-relaxed text-slate">
            A wallet is how you approve actions. Freighter is the most common choice.
            We never ask for your seed phrase.
          </p>
          {address ? (
            <p className="text-sm text-sea">Wallet connected. Continue when you are ready.</p>
          ) : (
            <Button loading={connecting} onClick={connect}>
              Connect wallet
            </Button>
          )}
          {address && (
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" loading={funding} onClick={onFund}>
                Get free Testnet funds
              </Button>
              <Button onClick={() => setStep(2)}>Continue</Button>
            </div>
          )}
          <p className="text-xs text-slate">
            Testnet funds have no real-world value. They only pay tiny network fees while you try the product.
          </p>
        </section>
      )}

      {step === 2 && (
        <section className="tm-surface max-w-2xl space-y-4 rounded-2xl p-6">
          <h2 className="font-display text-2xl text-deep">What best describes you?</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {ROLES.map((item) => (
              <button
                key={item.type}
                type="button"
                onClick={() => setRole(item.type)}
                className={`rounded-2xl border p-4 text-left transition ${
                  role === item.type
                    ? "border-sea bg-foam"
                    : "border-deep/10 bg-white hover:border-sea/40"
                }`}
              >
                <p className="font-medium text-deep">{item.title}</p>
                <p className="mt-1 text-sm text-slate">{item.blurb}</p>
              </button>
            ))}
          </div>
          <Button onClick={() => setStep(3)}>Continue</Button>
        </section>
      )}

      {step === 3 && (
        <form onSubmit={onRegister} className="tm-surface max-w-xl space-y-4 rounded-2xl p-6">
          <h2 className="font-display text-2xl text-deep">Name your organization</h2>
          <p className="text-sm text-slate">
            This name is public. Your wallet will ask you to approve publishing it.
          </p>
          <label className="block text-sm">
            <span className="text-slate">Organization name</span>
            <input
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-deep/15 bg-white px-3 py-2.5"
              placeholder="Acme Studio"
            />
          </label>
          <Button type="submit" className="w-full" loading={tx.phase === "signing" || tx.phase === "submitted"}>
            {address ? "Publish organization" : "Connect & publish"}
          </Button>
          <TxPanel
            tx={tx}
            nextHint="Next you can start a working relationship with another organization."
          />
          {error && (
            <ErrorBanner
              error={error}
              address={address}
              onDismiss={() => setError(null)}
            />
          )}
        </form>
      )}

      {step === 4 && (
        <section className="tm-surface max-w-xl space-y-4 rounded-2xl p-6">
          <h2 className="font-display text-2xl text-deep">You are in</h2>
          <p className="text-sm text-slate">
            Your organization is on Testnet. Pick a next action — each one is a real, signed record.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/relationships">
              <Button>Start a relationship</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="secondary">Go to dashboard</Button>
            </Link>
          </div>
          <button type="button" className="text-sm text-sea underline" onClick={() => router.push("/reviews")}>
            Or submit a review after a relationship completes
          </button>
        </section>
      )}
    </div>
  );
}
