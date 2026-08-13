export type ErrorKind =
  | "WalletNotInstalled"
  | "UserRejected"
  | "InsufficientBalance"
  | "WrongNetwork"
  | "AccountNotFunded"
  | "ContractCallFailed"
  | "Network"
  | "NotConfigured"
  | "Timeout"
  | "Unknown";

export class AppError extends Error {
  kind: ErrorKind;
  technical?: string;

  constructor(kind: ErrorKind, message: string, technical?: string) {
    super(message);
    this.name = "AppError";
    this.kind = kind;
    this.technical = technical;
  }
}

export function classifyError(err: unknown): AppError {
  const raw =
    err instanceof Error
      ? `${err.name}: ${err.message}`
      : typeof err === "string"
        ? err
        : JSON.stringify(err);
  const lower = raw.toLowerCase();

  if (
    lower.includes("not installed") ||
    lower.includes("no freighter") ||
    lower.includes("extension")
  ) {
    return new AppError(
      "WalletNotInstalled",
      "Wallet extension not found. Install Freighter or another Stellar wallet.",
      raw,
    );
  }
  if (
    lower.includes("user rejected") ||
    lower.includes("rejected by user") ||
    lower.includes("user declined") ||
    lower.includes("action cancelled")
  ) {
    return new AppError("UserRejected", "You cancelled the wallet signature.", raw);
  }
  if (lower.includes("insufficient") && lower.includes("balance")) {
    return new AppError(
      "InsufficientBalance",
      "Account balance is too low to cover network fees.",
      raw,
    );
  }
  if (lower.includes("wrong network") || lower.includes("network mismatch")) {
    return new AppError(
      "WrongNetwork",
      "Switch your wallet to Stellar Testnet and try again.",
      raw,
    );
  }
  if (
    lower.includes("account not found") ||
    lower.includes("not funded") ||
    lower.includes("404")
  ) {
    return new AppError(
      "AccountNotFunded",
      "This account is not funded on Testnet. Use Friendbot first.",
      raw,
    );
  }
  if (lower.includes("not configured") || lower.includes("missing contract")) {
    return new AppError(
      "NotConfigured",
      "Contract addresses are not configured. Deploy contracts or set env vars.",
      raw,
    );
  }
  if (
    lower.includes("timeout") ||
    lower.includes("still pending") ||
    lower.includes("timed out")
  ) {
    return new AppError(
      "Timeout",
      "The network is taking longer than expected. Wait a moment, then check Activity or try again.",
      raw,
    );
  }
  if (
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("rpc")
  ) {
    return new AppError(
      "Network",
      "Could not reach Stellar RPC. Check your connection and try again.",
      raw,
    );
  }
  if (
    lower.includes("contract") ||
    lower.includes("hosterror") ||
    lower.includes("invoke")
  ) {
    return new AppError(
      "ContractCallFailed",
      "The smart contract rejected this transaction.",
      raw,
    );
  }
  return new AppError("Unknown", "Something went wrong. Please try again.", raw);
}
