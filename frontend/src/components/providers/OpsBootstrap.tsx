"use client";

import { useEffect } from "react";
import { setPosthogClient } from "@/lib/analyticsClient";
import { setSentryClient } from "@/lib/monitoringClient";

/**
 * Optional production ops. No-ops unless public DSN/key env vars are set.
 * Secrets never live in the repo — only NEXT_PUBLIC_* project keys.
 */
export function OpsBootstrap() {
  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
      if (dsn) {
        const Sentry = await import("@sentry/browser");
        if (cancelled) return;
        Sentry.init({
          dsn,
          tracesSampleRate: 0.05,
          sendDefaultPii: false,
          beforeSend(event) {
            if (event.user) {
              event.user = { id: undefined };
            }
            return event;
          },
        });
        setSentryClient(Sentry);
      }

      const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
      if (key) {
        const posthog = (await import("posthog-js")).default;
        if (cancelled) return;
        posthog.init(key, {
          api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
          persistence: "localStorage",
          autocapture: false,
          capture_pageview: true,
          disable_session_recording: true,
          person_profiles: "identified_only",
          mask_all_text: true,
          mask_all_element_attributes: true,
        });
        setPosthogClient(posthog);
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
