export function shortenAddress(address: string, chars = 4): string {
  if (!address) return "";
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars)}…${address.slice(-chars)}`;
}

export function timeAgo(tsSeconds: number, nowMs = Date.now()): string {
  if (!tsSeconds) return "—";
  const diff = Math.max(0, Math.floor(nowMs / 1000 - tsSeconds));
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(tsSeconds * 1000).toLocaleDateString();
}

export function formatScore(score: number): string {
  return Math.round(score).toLocaleString();
}

export function ratingFromBps(bps: number): string {
  if (!bps) return "—";
  return (bps / 100).toFixed(1);
}

export function clsx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function explorerTxUrl(hash: string): string {
  return `https://stellar.expert/explorer/testnet/tx/${hash}`;
}

export function explorerContractUrl(id: string): string {
  return `https://stellar.expert/explorer/testnet/contract/${id}`;
}
