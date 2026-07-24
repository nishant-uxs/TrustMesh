"use client";

import { useWallet } from "@/hooks/useWallet";
import { shortenAddress } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { address, connecting, connect, disconnect, error } = useWallet();

  return (
    <div className="mb-8 space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="pl-12 lg:pl-0">
          <h1 className="font-display text-3xl tracking-tight text-deep md:text-4xl">
            {title}
          </h1>
          {subtitle && <p className="mt-1 max-w-2xl text-sm text-slate">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 self-end">
          {address ? (
            <>
              <span className="rounded-xl bg-white/80 px-3 py-2 font-mono text-xs text-deep">
                {shortenAddress(address, 5)}
              </span>
              <Button variant="secondary" size="sm" onClick={disconnect}>
                Disconnect
              </Button>
            </>
          ) : (
            <Button loading={connecting} onClick={connect}>
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
      {error && <ErrorBanner error={{ message: error, kind: "Wallet" }} />}
    </div>
  );
}
