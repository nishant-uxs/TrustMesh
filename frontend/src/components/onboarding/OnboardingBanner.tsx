"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchOrganizationByOwner } from "@/lib/contracts";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/Button";

export function OnboardingBanner() {
  const { address } = useWallet();
  const { completed } = useOnboarding(address);
  const [needsOrg, setNeedsOrg] = useState(false);

  useEffect(() => {
    if (!address || completed) {
      setNeedsOrg(false);
      return;
    }
    let cancelled = false;
    void fetchOrganizationByOwner(address).then((org) => {
      if (!cancelled) setNeedsOrg(!org);
    });
    return () => {
      cancelled = true;
    };
  }, [address, completed]);

  if (!address || completed || !needsOrg) return null;

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-sea/30 bg-foam/80 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium text-deep">Finish setting up your organization</p>
        <p className="mt-1 text-sm text-slate">
          Connect once, name your business, and you can start creating trust relationships.
        </p>
      </div>
      <Link href="/onboarding">
        <Button size="sm">Continue setup</Button>
      </Link>
    </div>
  );
}
