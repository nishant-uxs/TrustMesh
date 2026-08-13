"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { contractsConfigured } from "@/lib/config";
import { fetchContractEvents, type RawEvent } from "@/lib/contracts";
import { classifyError } from "@/lib/errors";
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
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const cursor = useRef<number | undefined>(undefined);
  const seen = useRef(new Set<string>());

  const refresh = useCallback(async () => {
    if (!contractsConfigured()) {
      setEvents([]);
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
      }
      setLive(true);
    } catch (err) {
      setLive(false);
      if (typeof console !== "undefined") {
        console.warn("TrustMesh event stream paused", classifyError(err).message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      void refresh();
    }, pollMs);
    return () => clearInterval(id);
  }, [refresh, pollMs]);

  return { events, live, loading, refresh };
}
