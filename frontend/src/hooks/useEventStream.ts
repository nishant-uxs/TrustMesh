"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { contractsConfigured } from "@/lib/config";
import { fetchContractEvents, type RawEvent } from "@/lib/contracts";
import { DEMO_ACTIVITY } from "@/lib/demo-data";
import type { ActivityEvent } from "@/lib/types";

function toActivity(ev: RawEvent): ActivityEvent {
  return {
    id: ev.id,
    type: ev.type,
    title: ev.type.replace(/([A-Z])/g, " $1").trim(),
    description: Array.isArray(ev.value)
      ? ev.value.map(String).slice(0, 3).join(" · ")
      : ev.topics.slice(1).join(" · ") || "On-chain TrustMesh event",
    txHash: ev.txHash,
    ledger: ev.ledger,
    timestamp: ev.timestamp,
    contractId: ev.contractId,
  };
}

export function useEventStream(pollMs = 5000) {
  const [events, setEvents] = useState<ActivityEvent[]>(DEMO_ACTIVITY);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const cursor = useRef<number | undefined>(undefined);
  const seen = useRef(new Set<string>());

  const refresh = useCallback(async () => {
    if (!contractsConfigured()) {
      setEvents(DEMO_ACTIVITY);
      setLive(false);
      setLoading(false);
      return;
    }
    try {
      const { events: raw, latestLedger } = await fetchContractEvents(cursor.current);
      cursor.current = latestLedger;
      const fresh = raw
        .filter((e) => {
          if (seen.current.has(e.id)) return false;
          seen.current.add(e.id);
          return true;
        })
        .map(toActivity);
      if (fresh.length) {
        setEvents((prev) => [...fresh, ...prev].slice(0, 100));
      } else if (loading) {
        // Keep demo until first real events arrive
        setEvents((prev) => (prev.length ? prev : DEMO_ACTIVITY));
      }
      setLive(true);
    } catch {
      setLive(false);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, pollMs);
    return () => clearInterval(id);
  }, [refresh, pollMs]);

  return { events, live, loading, refresh };
}
