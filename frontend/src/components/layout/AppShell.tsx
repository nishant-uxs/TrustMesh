"use client";

import type { ReactNode } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OnboardingBanner } from "@/components/onboarding/OnboardingBanner";
import { NetworkBanner } from "@/components/layout/NetworkBanner";
import { Sidebar } from "@/components/layout/Sidebar";
import { TrustDataProvider } from "@/hooks/useTrustData";
import { WalletProvider } from "@/hooks/useWallet";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <WalletProvider>
      <TrustDataProvider>
        <ErrorBoundary>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2"
          >
            Skip to content
          </a>
          <div className="tm-mesh flex min-h-screen">
            <Sidebar />
            <main
              id="main"
              className="min-w-0 flex-1 overflow-x-hidden px-4 pb-10 pt-16 sm:px-6 lg:px-10 lg:pb-8 lg:pt-8"
            >
              <NetworkBanner />
              <OnboardingBanner />
              {children}
            </main>
          </div>
        </ErrorBoundary>
      </TrustDataProvider>
    </WalletProvider>
  );
}
