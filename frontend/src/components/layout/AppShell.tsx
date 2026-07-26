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
          <main className="min-w-0 flex-1 overflow-x-hidden px-4 pb-10 pt-16 sm:px-6 lg:px-10 lg:pb-8 lg:pt-8">
            {children}
          </main>
        </div>
      </ErrorBoundary>
    </WalletProvider>
  );
}
