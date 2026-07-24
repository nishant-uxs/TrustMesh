import { describe, expect, it } from "vitest";
import { AppError, classifyError } from "./errors";

describe("classifyError", () => {
  it("detects missing wallet", () => {
    expect(classifyError(new Error("Freighter extension not installed")).kind).toBe(
      "WalletNotInstalled",
    );
  });

  it("detects user rejection", () => {
    expect(classifyError(new Error("User rejected the request")).kind).toBe(
      "UserRejected",
    );
  });

  it("detects insufficient balance", () => {
    expect(classifyError(new Error("insufficient balance for fee")).kind).toBe(
      "InsufficientBalance",
    );
  });

  it("detects wrong network", () => {
    expect(classifyError(new Error("wrong network selected")).kind).toBe(
      "WrongNetwork",
    );
  });

  it("detects unfunded account", () => {
    expect(classifyError(new Error("Account not found / not funded")).kind).toBe(
      "AccountNotFunded",
    );
  });

  it("detects missing config", () => {
    expect(classifyError(new Error("not configured: missing contract")).kind).toBe(
      "NotConfigured",
    );
  });

  it("detects network failures", () => {
    expect(classifyError(new Error("Failed to fetch from RPC")).kind).toBe("Network");
  });

  it("detects contract failures", () => {
    expect(classifyError(new Error("HostError contract invoke failed")).kind).toBe(
      "ContractCallFailed",
    );
  });

  it("falls back to unknown", () => {
    const err = classifyError(new Error("something odd"));
    expect(err).toBeInstanceOf(AppError);
    expect(err.kind).toBe("Unknown");
  });
});
