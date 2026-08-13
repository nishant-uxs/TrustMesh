export const PRODUCT_EVENTS = [
  "wallet_connected",
  "wallet_disconnected",
  "onboarding_started",
  "onboarding_completed",
  "organization_created",
  "relationship_created",
  "relationship_accepted",
  "relationship_completed",
  "dispute_opened",
  "review_submitted",
  "review_verified",
  "transaction_started",
  "transaction_succeeded",
  "transaction_failed",
  "account_funded",
] as const;

export type ProductEventName = (typeof PRODUCT_EVENTS)[number];

export interface ProductEvent {
  name: ProductEventName;
  at: number;
  /** Opaque properties only — never store full wallet addresses. */
  props?: Record<string, string | number | boolean>;
}

const STORAGE_KEY = "tm-product-events";
const MAX_EVENTS = 400;

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadProductEvents(): ProductEvent[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ProductEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function persistProductEvents(events: ProductEvent[]): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
}

export function summarizeProductEvents(events: ProductEvent[]): Record<ProductEventName, number> {
  const counts = Object.fromEntries(PRODUCT_EVENTS.map((name) => [name, 0])) as Record<
    ProductEventName,
    number
  >;
  for (const event of events) {
    if (event.name in counts) counts[event.name] += 1;
  }
  return counts;
}

/** Strip secrets / full addresses before analytics or monitoring. */
export function sanitizeAnalyticsProps(
  props?: Record<string, unknown>,
): Record<string, string | number | boolean> | undefined {
  if (!props) return undefined;
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(props)) {
    const lower = key.toLowerCase();
    if (
      lower.includes("secret") ||
      lower.includes("seed") ||
      lower.includes("mnemonic") ||
      lower.includes("private")
    ) {
      continue;
    }
    if (typeof value === "string" && /^G[A-Z0-9]{55}$/.test(value)) {
      out[key] = `${value.slice(0, 4)}…${value.slice(-4)}`;
      continue;
    }
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      out[key] = value;
    }
  }
  return out;
}
