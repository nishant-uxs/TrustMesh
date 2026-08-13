"use client";

import {
  loadProductEvents,
  persistProductEvents,
  sanitizeAnalyticsProps,
  type ProductEventName,
} from "./analytics";

type PostHogLike = {
  capture: (name: string, props?: Record<string, unknown>) => void;
};

let posthogClient: PostHogLike | null = null;

export function setPosthogClient(client: PostHogLike | null): void {
  posthogClient = client;
}

export function track(
  name: ProductEventName,
  props?: Record<string, unknown>,
): void {
  const safe = sanitizeAnalyticsProps(props);
  const events = loadProductEvents();
  events.push({ name, at: Date.now(), props: safe });
  persistProductEvents(events);
  posthogClient?.capture(name, safe);
}
