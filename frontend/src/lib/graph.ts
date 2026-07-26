import type { Organization } from "./types";

/** Newest-first ID window used when scanning on-chain totals. */
export function rangeIds(total: number, limit: number): number[] {
  if (total <= 0) return [];
  const start = Math.max(1, total - limit + 1);
  const ids: number[] = [];
  for (let i = start; i <= total; i += 1) ids.push(i);
  return ids;
}

export function averageTrust(orgs: Organization[]): number {
  if (!orgs.length) return 0;
  return Math.round(
    orgs.reduce((sum, o) => sum + (o.trustScore || 0), 0) / orgs.length,
  );
}
