"use client";

import { recordIncident, sentryConfigured } from "./monitoring";
import { sanitizeAnalyticsProps } from "./analytics";

type SentryLike = {
  captureException: (err: unknown, hint?: { extra?: Record<string, unknown> }) => void;
};

let sentry: SentryLike | null = null;

export function setSentryClient(client: SentryLike | null): void {
  sentry = client;
}

export function reportError(error: unknown, context?: string): void {
  const appErr = recordIncident(error, context);
  if (sentryConfigured() && sentry) {
    sentry.captureException(error, {
      extra: sanitizeAnalyticsProps({
        kind: appErr.kind,
        context: context || "",
      }),
    });
  }
}
