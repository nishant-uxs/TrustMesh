"use client";

import type { ReactNode } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { WalletProvider } from "@/hooks/useWallet";
import { Sidebar } from "@/components/layout/Sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <WalletProvider>
      <ErrorBoundary>
        <div className="tm-mesh flex min-h-screen">
          <Sidebar />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</main>
        </div>
      </ErrorBoundary>
    </WalletProvider>
  );
}
