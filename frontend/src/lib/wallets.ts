"use client";

import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit";
import { Networks } from "@creit.tech/stellar-wallets-kit/types";
import {
  FreighterModule,
  FREIGHTER_ID,
} from "@creit.tech/stellar-wallets-kit/modules/freighter";
import { AlbedoModule } from "@creit.tech/stellar-wallets-kit/modules/albedo";
import { xBullModule } from "@creit.tech/stellar-wallets-kit/modules/xbull";
import { LobstrModule } from "@creit.tech/stellar-wallets-kit/modules/lobstr";
import { HanaModule } from "@creit.tech/stellar-wallets-kit/modules/hana";
import { RabetModule } from "@creit.tech/stellar-wallets-kit/modules/rabet";
import { NETWORK } from "./config";
import { AppError } from "./errors";

let initialized = false;

type FreighterNetworkApi = {
  getNetworkDetails?: () => Promise<{ networkPassphrase?: string; network?: string }>;
  getNetwork?: () => Promise<string>;
};

function freighterApi(): FreighterNetworkApi | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { freighterApi?: FreighterNetworkApi }).freighterApi ?? null;
}

/** Throws WrongNetwork when Freighter reports a non-Testnet passphrase. */
export async function assertWalletOnTestnet(): Promise<void> {
  const api = freighterApi();
  if (!api) return;
  try {
    if (api.getNetworkDetails) {
      const details = await api.getNetworkDetails();
      const passphrase = details.networkPassphrase;
      if (passphrase && passphrase !== NETWORK.passphrase) {
        throw new AppError(
          "WrongNetwork",
          "Switch your wallet to Stellar Testnet and try again.",
          passphrase,
        );
      }
      return;
    }
    if (api.getNetwork) {
      const network = await api.getNetwork();
      if (network && !/test/i.test(network) && network !== "TESTNET") {
        throw new AppError(
          "WrongNetwork",
          "Switch your wallet to Stellar Testnet and try again.",
          network,
        );
      }
    }
  } catch (err) {
    if (err instanceof AppError) throw err;
    // Older wallets may not expose network details — do not block signing.
  }
}

export function ensureWalletKit(): void {
  if (typeof window === "undefined" || initialized) return;
  StellarWalletsKit.init({
    network: Networks.TESTNET,
    selectedWalletId: FREIGHTER_ID,
    modules: [
      new FreighterModule(),
      new AlbedoModule(),
      new xBullModule(),
      new LobstrModule(),
      new HanaModule(),
      new RabetModule(),
    ],
  });
  initialized = true;
}

export async function connectWallet(): Promise<string> {
  ensureWalletKit();
  const { address } = await StellarWalletsKit.authModal();
  if (!address) throw new Error("Wallet did not return an address");
  await assertWalletOnTestnet();
  return address;
}

export async function disconnectWallet(): Promise<void> {
  ensureWalletKit();
  await StellarWalletsKit.disconnect();
}

export async function signTransactionXdr(xdr: string, address: string): Promise<string> {
  ensureWalletKit();
  await assertWalletOnTestnet();
  const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
    address,
    networkPassphrase: NETWORK.passphrase,
  });
  return signedTxXdr;
}

/** Soft check for UI banners — returns false when Freighter is clearly not on Testnet. */
export async function isWalletLikelyOnTestnet(): Promise<boolean> {
  try {
    await assertWalletOnTestnet();
    return true;
  } catch (err) {
    if (err instanceof AppError && err.kind === "WrongNetwork") return false;
    return true;
  }
}
