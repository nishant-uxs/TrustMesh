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

let initialized = false;

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
  return address;
}

export async function disconnectWallet(): Promise<void> {
  ensureWalletKit();
  await StellarWalletsKit.disconnect();
}

export async function signTransactionXdr(xdr: string, address: string): Promise<string> {
  ensureWalletKit();
  const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
    address,
    networkPassphrase: NETWORK.passphrase,
  });
  return signedTxXdr;
}
