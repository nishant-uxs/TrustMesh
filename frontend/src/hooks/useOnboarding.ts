"use client";

import { useCallback, useEffect, useState } from "react";
import type { OrgType } from "@/lib/types";

export interface OnboardingState {
  completed: boolean;
  role?: OrgType;
  orgId?: number;
}

function storageKey(address: string): string {
  return `tm-onboarding:${address}`;
}

export function loadOnboarding(address: string | null): OnboardingState {
  if (!address || typeof window === "undefined") return { completed: false };
  try {
    const raw = window.localStorage.getItem(storageKey(address));
    if (!raw) return { completed: false };
    const parsed = JSON.parse(raw) as OnboardingState;
    return parsed && typeof parsed.completed === "boolean" ? parsed : { completed: false };
  } catch {
    return { completed: false };
  }
}

export function saveOnboarding(address: string, state: OnboardingState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(address), JSON.stringify(state));
}

export function useOnboarding(address: string | null) {
  const [state, setState] = useState<OnboardingState>({ completed: false });

  useEffect(() => {
    setState(loadOnboarding(address));
  }, [address]);

  const update = useCallback(
    (patch: Partial<OnboardingState>) => {
      if (!address) return;
      const next = { ...loadOnboarding(address), ...patch };
      saveOnboarding(address, next);
      setState(next);
    },
    [address],
  );

  return { ...state, update };
}
