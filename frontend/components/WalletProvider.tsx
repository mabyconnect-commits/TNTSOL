"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type Wallet = {
  connected: boolean;
  address: string;
  devBalance: number;
  connect: () => void;
  disconnect: () => void;
};

const WalletContext = createContext<Wallet | null>(null);

const MOCK_ADDRESS = "7XnZ…q9kF";

export function WalletProvider({ children }: { children: ReactNode }) {
  // Starts connected so the prototype shows the full UI; the pill toggles it.
  const [connected, setConnected] = useState(true);
  return (
    <WalletContext.Provider
      value={{
        connected,
        address: MOCK_ADDRESS,
        devBalance: 2.41,
        connect: () => setConnected(true),
        disconnect: () => setConnected(false),
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): Wallet {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
