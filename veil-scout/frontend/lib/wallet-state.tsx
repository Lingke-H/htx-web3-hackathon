"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type EthereumProvider = {
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
};

type WalletStateValue = {
  address: string | null;
  balance: string | null;
  chainId: number | null;
  chainName: string | null;
  error: string | null;
  hasProvider: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  switchToDemoChain: () => Promise<void>;
};

const WalletStateContext = createContext<WalletStateValue | null>(null);

const baseSepoliaParams = {
  chainId: "0x14a34",
  chainName: "Base Sepolia",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["https://sepolia.base.org"],
  blockExplorerUrls: ["https://sepolia.basescan.org"],
} as const;

export function getInjectedProvider() {
  if (typeof window === "undefined") {
    return null;
  }

  const provider = (window as Window & { ethereum?: EthereumProvider }).ethereum;
  return provider ?? null;
}

export function chainNameFromId(chainId: number | null) {
  if (chainId === null) {
    return null;
  }

  return (
    {
      1: "Ethereum Mainnet",
      84532: "Base Sepolia",
      421614: "Arbitrum Sepolia",
      31337: "Local Anvil",
    }[chainId] ?? `Chain ${chainId}`
  );
}

function formatBalance(hexBalance: string) {
  const wei = BigInt(hexBalance);
  const weiPerEth = BigInt("1000000000000000000");
  const whole = wei / weiPerEth;
  const fraction = wei % weiPerEth;
  const fractionText = fraction.toString().padStart(18, "0").slice(0, 4).replace(/0+$/, "");

  return fractionText ? `${whole.toString()}.${fractionText} ETH` : `${whole.toString()} ETH`;
}

async function readWalletSnapshot(provider: EthereumProvider) {
  const accounts = (await provider.request({
    method: "eth_accounts",
  })) as string[];

  const address = accounts[0] ?? null;
  const chainHex = (await provider.request({ method: "eth_chainId" })) as string;
  const chainId = chainHex ? Number.parseInt(chainHex, 16) : null;
  const balanceHex = address
    ? ((await provider.request({
        method: "eth_getBalance",
        params: [address, "latest"],
      })) as string)
    : null;

  return {
    address,
    balance: balanceHex ? formatBalance(balanceHex) : null,
    chainId,
    chainName: chainNameFromId(chainId),
  };
}

export function WalletStateProvider({ children }: { children: ReactNode }) {
  const [hasProvider] = useState(() => Boolean(getInjectedProvider()));
  const [isConnecting, setIsConnecting] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [chainName, setChainName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const provider = getInjectedProvider();

    if (!provider) {
      return;
    }

    const refresh = async () => {
      try {
        const snapshot = await readWalletSnapshot(provider);
        setAddress(snapshot.address);
        setBalance(snapshot.balance);
        setChainId(snapshot.chainId);
        setChainName(snapshot.chainName);
        setError(null);
      } catch {
        setError("Failed to read wallet state.");
      }
    };

    void refresh();

    const handleAccountsChanged = () => {
      void refresh();
    };

    const handleChainChanged = () => {
      void refresh();
    };

    provider.on?.("accountsChanged", handleAccountsChanged);
    provider.on?.("chainChanged", handleChainChanged);

    return () => {
      provider.removeListener?.("accountsChanged", handleAccountsChanged);
      provider.removeListener?.("chainChanged", handleChainChanged);
    };
  }, []);

  const connect = async () => {
    const provider = getInjectedProvider();

    if (!provider) {
      setError("No injected wallet detected in this browser.");
      return;
    }

    setIsConnecting(true);

    try {
      await provider.request({ method: "eth_requestAccounts" });
      const snapshot = await readWalletSnapshot(provider);
      setAddress(snapshot.address);
      setBalance(snapshot.balance);
      setChainId(snapshot.chainId);
      setChainName(snapshot.chainName);
      setError(null);
    } catch {
      setError("Wallet connection was cancelled or failed.");
    } finally {
      setIsConnecting(false);
    }
  };

  const switchToDemoChain = async () => {
    const provider = getInjectedProvider();

    if (!provider) {
      setError("No injected wallet detected in this browser.");
      return;
    }

    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: baseSepoliaParams.chainId }],
      });
      const snapshot = await readWalletSnapshot(provider);
      setChainId(snapshot.chainId);
      setChainName(snapshot.chainName);
      setBalance(snapshot.balance);
      setError(null);
    } catch {
      try {
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [baseSepoliaParams],
        });
        const snapshot = await readWalletSnapshot(provider);
        setChainId(snapshot.chainId);
        setChainName(snapshot.chainName);
        setBalance(snapshot.balance);
        setError(null);
      } catch {
        setError("Unable to switch to Base Sepolia automatically.");
      }
    }
  };

  return (
    <WalletStateContext.Provider
      value={{
        address,
        balance,
        chainId,
        chainName,
        error,
        hasProvider,
        isConnected: Boolean(address),
        isConnecting,
        connect,
        switchToDemoChain,
      }}
    >
      {children}
    </WalletStateContext.Provider>
  );
}

export function useWalletState() {
  const context = useContext(WalletStateContext);

  if (!context) {
    throw new Error("useWalletState must be used within WalletStateProvider");
  }

  return context;
}
