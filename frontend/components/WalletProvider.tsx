"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode, FC } from "react";
import {
  ConnectionProvider as RawConnectionProvider,
  WalletProvider as RawSolanaWalletProvider,
  useConnection,
  useWallet as useAdapterWallet,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider as RawWalletModalProvider, useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Adapter } from "@solana/wallet-adapter-base";
import { clusterApiUrl, LAMPORTS_PER_SOL } from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";

// wallet-adapter ships React 18 types; alias through casts so the providers
// type-check as JSX components under React 19's stricter JSX namespace.
const ConnectionProvider = RawConnectionProvider as unknown as FC<{ endpoint: string; children: ReactNode }>;
const SolanaWalletProvider = RawSolanaWalletProvider as unknown as FC<{ wallets: Adapter[]; autoConnect?: boolean; children: ReactNode }>;
const WalletModalProvider = RawWalletModalProvider as unknown as FC<{ children: ReactNode }>;

export const NETWORK = "devnet";
const ENDPOINT = clusterApiUrl(NETWORK);

// Sets up the Solana connection + wallet adapters. An empty wallets array is
// intentional: modern wallet-adapter auto-detects Wallet Standard wallets
// (Phantom, Solflare, Backpack, …) that the user has installed.
export function WalletProvider({ children }: { children: ReactNode }) {
  const endpoint = useMemo(() => ENDPOINT, []);
  const wallets = useMemo<Adapter[]>(() => [], []);
  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}

type TntWallet = {
  connected: boolean;
  connecting: boolean;
  address: string;
  publicKey: string | null;
  devBalance: number | null;
  network: string;
  openModal: () => void;
  disconnect: () => void;
  refreshBalance: () => void;
  requestAirdrop: () => Promise<void>;
};

function shorten(a: string) {
  return a.slice(0, 4) + "…" + a.slice(-4);
}

export function useWallet(): TntWallet {
  const { connection } = useConnection();
  const { publicKey, connected, connecting, disconnect } = useAdapterWallet();
  const { setVisible } = useWalletModal();
  const [balance, setBalance] = useState<number | null>(null);

  const refreshBalance = useCallback(async () => {
    if (!publicKey) {
      setBalance(null);
      return;
    }
    try {
      const lamports = await connection.getBalance(publicKey);
      setBalance(lamports / LAMPORTS_PER_SOL);
    } catch {
      setBalance(null);
    }
  }, [publicKey, connection]);

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  const requestAirdrop = useCallback(async () => {
    if (!publicKey) throw new Error("No wallet connected");
    const sig = await connection.requestAirdrop(publicKey, LAMPORTS_PER_SOL);
    await connection.confirmTransaction(sig, "confirmed");
    await refreshBalance();
  }, [publicKey, connection, refreshBalance]);

  return {
    connected,
    connecting,
    address: publicKey ? shorten(publicKey.toBase58()) : "",
    publicKey: publicKey ? publicKey.toBase58() : null,
    devBalance: balance,
    network: NETWORK,
    openModal: () => setVisible(true),
    disconnect,
    refreshBalance,
    requestAirdrop,
  };
}
