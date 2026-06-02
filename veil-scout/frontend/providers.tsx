"use client";

import type { ReactNode } from "react";
import { AppStateProvider } from "@/lib/app-state";
import { WalletStateProvider } from "@/lib/wallet-state";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AppStateProvider>
      <WalletStateProvider>{children}</WalletStateProvider>
    </AppStateProvider>
  );
}
